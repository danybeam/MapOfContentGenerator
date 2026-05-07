import { ListedFiles, Plugin, TAbstractFile, TFile, TFolder, Vault } from "obsidian";

import { DEFAULT_SETTINGS, MapOfConceptGeneratorPluginSettings, MapOfConceptGeneratorPluginSettingTab } from "./settings";

export default class MapOfConceptGeneratorPlugin extends Plugin {
  settings: MapOfConceptGeneratorPluginSettings = {
    MapOfConceptDirectory: "",
    MapOfConceptTemplate: "",
    ExcludeAllBases: false,
    ExcludeSelf: false,
    DeleteEmptyFoldersOnGeneration: false,
    GenerateOnStartup: false
  };

  async onload() {
    await this.loadSettings();

    this.addRibbonIcon('dice', 'foo', async () => await this.GenerateMapsOfConcept());
    this.addSettingTab(new MapOfConceptGeneratorPluginSettingTab(this.app, this));

    if (this.settings.GenerateOnStartup) {
      await this.GenerateMapsOfConcept();
    }
  }

  onunload() {
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<MapOfConceptGeneratorPluginSettings>);
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async GenerateMapsOfConcept() {
    await GenerateMapsOfConcept(this.app.vault, this.settings)
  }
}

async function GenerateMapsOfConcept(vault: Vault, settings: MapOfConceptGeneratorPluginSettings) {
  let pendingFolders = [vault.getFolderByPath(settings.MapOfConceptDirectory)]

  let MissingFolders: string[] = vault.getAllFolders().filter(val => !val.path.startsWith(settings.MapOfConceptDirectory)).map(val => val.path);
  let GeneratedFolders: string[] = [];
  let ExtraFolders: string[] = [];

  // Iterate through any pending folder
  while (pendingFolders.length > 0) {
    let folder = pendingFolders.pop();
    if (folder == null) continue;

    for (let child of folder.children) {
      if (child instanceof TFolder) {
        pendingFolders.push(child)
        continue
      }

      if (!(child instanceof TFile)) continue;
      if (child.extension != "base") continue;

      let childPath = child.path.slice(settings.MapOfConceptDirectory.length + 1, -5);
      let indexOfChild = MissingFolders.indexOf(childPath);

      if (indexOfChild == -1) {
        ExtraFolders.push(child.path);
      } else {
        GeneratedFolders.push(childPath);
        MissingFolders.remove(childPath)
      }
    }

  }


  // Delete any bases that do not match to folders anymore
  for (let extra of ExtraFolders) {
    let abstractFile = vault.getAbstractFileByPath(extra);
    if (abstractFile != null) {
      await vault.delete(abstractFile);
    }
  }




  // Generate the missing bases
  let replaceText = "";

  // I'm sure there's some "NOR" magic I could do here but this is hard enough to read as is
  if (settings.ExcludeAllBases && settings.ExcludeSelf) {
    replaceText = 'file.ext != "base"';
  } else if (settings.ExcludeAllBases && !settings.ExcludeSelf) {
    replaceText = 'file.ext != "base" || file == this.file';
  } else if (!settings.ExcludeAllBases && settings.ExcludeSelf) {
    replaceText = ' file != this.file';
  } else if (!settings.ExcludeAllBases && !settings.ExcludeSelf) {
    replaceText = 'true';
  }

  // Replace settings
  let baseTemplate = settings.MapOfConceptTemplate.replace("$1", replaceText);

  for (let folder of MissingFolders) {
    let splitFolderbase = folder.split('/');
    splitFolderbase.pop();
    let newFolder = [settings.MapOfConceptDirectory, ...splitFolderbase].join('/');

    if (vault.getAbstractFileByPath(newFolder) == null) {
      await vault.createFolder(newFolder);
    }

    let basePath = settings.MapOfConceptDirectory + '/' + folder + '.base';
    if (vault.getAbstractFileByPath(basePath) == null) {
      await vault.create(basePath, baseTemplate);
    }
  }

  let pendingUpdates: TAbstractFile[] = vault.getFiles()
    .filter(val => val.path.startsWith(settings.MapOfConceptDirectory))
    .filter(val => val.extension == "base");

  for (let file of pendingUpdates) {
    await vault.modify(file as TFile, baseTemplate);
  }

  // Delete empty folders recursively
  if (settings.DeleteEmptyFoldersOnGeneration) {
    await DeleteEmptyFoldersRecursively(vault, settings.MapOfConceptDirectory);
  }
}

async function DeleteEmptyFoldersRecursively(vault: Vault, root: string | null): Promise<boolean> {
  if (root == null) return true;

  let abstractFile = vault.getAbstractFileByPath(root);
  if (abstractFile instanceof TFile) return false;
  if (!(abstractFile instanceof TFolder)) return false;
  let canDelete: boolean = true;

  let childrenPaths = abstractFile.children.map(val => val.path);

  for (let child of childrenPaths) {
    let result = await DeleteEmptyFoldersRecursively(vault, child);
    canDelete = result && canDelete;
  }

  if (canDelete) {
    await vault.delete(abstractFile);
  }

  return canDelete;
}