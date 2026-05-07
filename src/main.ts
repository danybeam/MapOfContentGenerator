import { FileManager, Plugin, TAbstractFile, TFile, TFolder, Vault } from "obsidian";

import { DEFAULT_SETTINGS, MapOfContentGeneratorPluginSettings, MapOfContentGeneratorPluginSettingTab } from "./settings.ts";

export default class MapOfContentGeneratorPlugin extends Plugin {
  settings: MapOfContentGeneratorPluginSettings = {
    MapOfContentDirectory: "",
    MapOfContentTemplate: "",
    ExcludeAllBases: false,
    ExcludeSelf: false,
    DeleteEmptyFoldersOnGeneration: false,
    GenerateOnStartup: false,
    RootMapTemplate: "",
    UpdateTemplatesOnGeneration: false,
    GenerateRootMapOfContent: false,
    RemoveExtraBases: false,
    RootMapOfContentName: "",
    IgnoreExtrasDuringUpdate: false,
    AddRibbonButton: false
  };

  fileManager: FileManager | null = null;

  async onload() {
    await this.loadSettings();

    if (this.settings.AddRibbonButton) {
      this.addRibbonIcon('table-of-contents', 'Generate maps of concept', async () => await this.GenerateMapsOfConcept());
    }
    this.addSettingTab(new MapOfContentGeneratorPluginSettingTab(this.app, this));
    this.fileManager = this.app.fileManager;

    if (this.settings.GenerateOnStartup) {
      await this.GenerateMapsOfConcept();
    }
  }

  onunload() {
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<MapOfContentGeneratorPluginSettings>);
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async GenerateMapsOfConcept() {
    await GenerateMapsOfConcept(this.app.vault, this.settings, this.fileManager);
  }
}

async function GenerateMapsOfConcept(vault: Vault, settings: MapOfContentGeneratorPluginSettings, fileManager: FileManager | null) {

  if (fileManager == null) {
    return;
  }

  let pendingFolders = [vault.getFolderByPath(settings.MapOfContentDirectory)]

  let MissingFolders: string[] = vault.getAllFolders().filter(val => !val.path.startsWith(settings.MapOfContentDirectory)).map(val => val.path);
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

      let childPath = child.path.slice(settings.MapOfContentDirectory.length + 1, -5);
      let indexOfChild = MissingFolders.indexOf(childPath);

      if (indexOfChild == -1) {
        ExtraFolders.push(child.path);
      } else {
        GeneratedFolders.push(childPath);
        MissingFolders.remove(childPath)
      }
    }

  }


  if (settings.RemoveExtraBases) {
    // Delete any bases that do not match to folders anymore
    for (let extra of ExtraFolders) {
      let abstractFile = vault.getAbstractFileByPath(extra);
      if (abstractFile != null) {

        await fileManager.trashFile(abstractFile);
      }
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
  let baseTemplate = settings.MapOfContentTemplate.replace("$1", replaceText);

  for (let folder of MissingFolders) {
    let splitFolderbase = folder.split('/');
    splitFolderbase.pop();
    let newFolder = [settings.MapOfContentDirectory, ...splitFolderbase].join('/');

    if (vault.getAbstractFileByPath(newFolder) == null) {
      await vault.createFolder(newFolder);
    }

    let basePath = settings.MapOfContentDirectory + '/' + folder + '.base';
    if (vault.getAbstractFileByPath(basePath) == null) {
      await vault.create(basePath, baseTemplate);
    }
  }

  if (settings.GenerateRootMapOfContent) {
    let basePath = settings.MapOfContentDirectory + "/" + settings.RootMapOfContentName + ".base";
    if (vault.getAbstractFileByPath(basePath) == null) {
      await vault.create(basePath, settings.RootMapTemplate);
    }
  }

  if (settings.UpdateTemplatesOnGeneration) {

    let pendingUpdates: TAbstractFile[] = vault.getFiles()
      .filter(val => val.path.startsWith(settings.MapOfContentDirectory))
      .filter(val => val.extension == "base");

    for (let file of pendingUpdates) {
      if (file.parent?.path == settings.MapOfContentDirectory && file.name == settings.RootMapOfContentName + ".base" && file instanceof TFile) {
        await vault.modify(file, settings.RootMapTemplate);
        continue;
      }

      // This needs to be second so that the root does not get ignored
      // If we're here we know we want the updates but the root will be marked as extra all of the time
      if (settings.IgnoreExtrasDuringUpdate && ExtraFolders.contains(file.path)) {
        continue;
      }

      if (file instanceof TFile) {
        await vault.modify(file, baseTemplate);
      }
    }
  }

  // Delete empty folders recursively
  if (settings.DeleteEmptyFoldersOnGeneration) {
    await DeleteEmptyFoldersRecursively(vault, fileManager, settings.MapOfContentDirectory);
  }
}

async function DeleteEmptyFoldersRecursively(vault: Vault, fileManager: FileManager | null, root: string | null): Promise<boolean> {
  if (root == null) return true;
  if (fileManager == null) return false;

  let abstractFile = vault.getAbstractFileByPath(root);
  if (abstractFile instanceof TFile) return false;
  if (!(abstractFile instanceof TFolder)) return false;
  let canDelete: boolean = true;

  let childrenPaths = abstractFile.children.map(val => val.path);

  for (let child of childrenPaths) {
    let result = await DeleteEmptyFoldersRecursively(vault, fileManager, child);
    canDelete = result && canDelete;
  }

  if (canDelete) {
    await fileManager.trashFile(abstractFile);
  }

  return canDelete;
}