import { App, PluginSettingTab, Setting } from "obsidian";

import MapOfConceptGeneratorPlugin from "./main";

export interface MapOfConceptGeneratorPluginSettings {
  AddRibbonButton: boolean;
  MapOfConceptDirectory: string;
  MapOfConceptTemplate: string;
  RootMapTemplate: string;
  ExcludeAllBases: boolean;
  ExcludeSelf: boolean;
  DeleteEmptyFoldersOnGeneration: boolean;
  GenerateOnStartup: boolean;
  UpdateTemplatesOnGeneration: boolean;
  IgnoreExtrasDuringUpdate: boolean;
  GenerateRootMapOfConcept: boolean;
  RootMapOfConceptName: string;
  RemoveExtraBases: boolean;
}

export const DEFAULT_SETTINGS: MapOfConceptGeneratorPluginSettings = {
  AddRibbonButton: true,
  MapOfConceptDirectory: '',
  MapOfConceptTemplate: `views:
  - type: table
    name: Table
    filters:
      and:
        - file.path.startsWith(this.file.path.slice(21,-5))
        - $1
    groupBy:
      property: file.tags
      direction: ASC
    order:
      - file.name
      - file.folder
      - file.tags
    sort:
      - property: file.name
        direction: ASC
`,
  RootMapTemplate: `views:
  - type: list
    name: View
    filters:
      and:
        - file.ext == "base"
        - file.folder.startsWith(this.file.folder)
    groupBy:
      property: file.folder
      direction: ASC
    order:
      - file.name
    sort:
      - property: file.name
        direction: ASC
`,
  ExcludeAllBases: true,
  ExcludeSelf: true,
  DeleteEmptyFoldersOnGeneration: true,
  GenerateOnStartup: true,
  UpdateTemplatesOnGeneration: true,
  IgnoreExtrasDuringUpdate: true,
  GenerateRootMapOfConcept: true,
  RootMapOfConceptName: "root",
  RemoveExtraBases: true
}

export class MapOfConceptGeneratorPluginSettingTab extends PluginSettingTab {
  plugin: MapOfConceptGeneratorPlugin;

  constructor(app: App, plugin: MapOfConceptGeneratorPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();
    
    new Setting(containerEl)
      .setName('Enable ribbon button')
      .setDesc('Whether to show the ribbon button (needs restart)')
      .addToggle(cb => {
        cb
          .setValue(this.plugin.settings.AddRibbonButton)
          .onChange(async (value) => {
            this.plugin.settings.AddRibbonButton = value;
            this.plugin.saveSettings();
          })
      });

    new Setting(containerEl)
      .setName('Map of Concept base directory')
      .setDesc('Set directory to generate maps of concept into')
      .addText(text => text
        .setPlaceholder('Enter the folder to be used as a base')
        .setValue(this.plugin.settings.MapOfConceptDirectory)
        .onChange(async (value) => {
          this.plugin.settings.MapOfConceptDirectory = value;
          await this.plugin.saveSettings();
        })

      );

    /*new Setting(containerEl)
      .setName('Map of Concept template')
      .setDesc('(WIP please use regular template for now) Set the template for the map of concept')
      .addTextArea(text => text
        .setPlaceholder('')
        .setValue(this.plugin.settings.MapOfConceptTemplate)
        .onChange(async (value) => {
          this.plugin.settings.MapOfConceptTemplate = value;
          await this.plugin.saveSettings();
        })
      );*/

    /*new Setting(containerEl)
      .setName('Root map of concept template')
      .setDesc('(WIP please use regular template for now) Set the template for the map of concept at root')
      .addTextArea(text => text
        .setPlaceholder('')
        .setValue(this.plugin.settings.RootMapTemplate)
        .onChange(async (value) => {
          this.plugin.settings.RootMapTemplate = value;
          await this.plugin.saveSettings();
        })
      );*/

    new Setting(containerEl)
      .setName('Exclude all bases')
      .setDesc('Whether to include bases in the view')
      .addToggle(cb => {
        cb
          .setValue(this.plugin.settings.ExcludeAllBases)
          .onChange(async (value) => {
            this.plugin.settings.ExcludeAllBases = value;
            this.plugin.saveSettings();
          })
      });

    new Setting(containerEl)
      .setName('Exclude self')
      .setDesc('Whether to include itself in the view')
      .addToggle(cb => {
        cb
          .setValue(this.plugin.settings.ExcludeSelf)
          .onChange(async (value) => {
            this.plugin.settings.ExcludeSelf = value;
            this.plugin.saveSettings();
          })
      });

    new Setting(containerEl)
      .setName('Delete empty folders after generation')
      .setDesc('This only affects folders under the base map of contents folder but as of right now it could delete the map of concept folder itself\nWARNING: THIS CAN AND WILL DELETE YOUR MAP OF CONCEPT FOLDER IF IT IS EMPTY AFTER CLEANING THE EXTRAS')
      .addToggle(cb => {
        cb
          .setValue(this.plugin.settings.DeleteEmptyFoldersOnGeneration)
          .onChange(async (value) => {
            this.plugin.settings.DeleteEmptyFoldersOnGeneration = value;
            this.plugin.saveSettings();
          })
      });

    new Setting(containerEl)
      .setName('Generate on startup')
      .setDesc('Whether to generate/update the map of concepts on load')
      .addToggle(cb => {
        cb
          .setValue(this.plugin.settings.GenerateOnStartup)
          .onChange(async (value) => {
            this.plugin.settings.GenerateOnStartup = value;
            this.plugin.saveSettings();
          })
      });

    new Setting(containerEl)
      .setName('Update templates on generation')
      .setDesc("Whether to update the map of concepts when they're generated\nWARNING: THIS IS A DESTRUCTIVE OPERATION AND IT WILL MODIFY ANY CUSTOM SETTINGS YOU HAVE ON YOUR BASES")
      .addToggle(cb => {
        cb
          .setValue(this.plugin.settings.UpdateTemplatesOnGeneration)
          .onChange(async (value) => {
            this.plugin.settings.UpdateTemplatesOnGeneration = value;
            this.plugin.saveSettings();
          })
      });

    new Setting(containerEl)
      .setName('Ignore extras during update')
      .setDesc("Whether to update the bases that do not map to a folder in the vault\nWARNING: THIS IS A DESTRUCTIVE OPERATION AND IT WILL MODIFY ANY CUSTOM SETTINGS YOU HAVE ON YOUR BASES")
      .addToggle(cb => {
        cb
          .setValue(this.plugin.settings.IgnoreExtrasDuringUpdate)
          .onChange(async (value) => {
            this.plugin.settings.IgnoreExtrasDuringUpdate = value;
            this.plugin.saveSettings();
          })
      });

    new Setting(containerEl)
      .setName('Generate root Map of Concept')
      .setDesc("Whether to make a special map of concept that links to the other maps of concepts")
      .addToggle(cb => {
        cb
          .setValue(this.plugin.settings.GenerateRootMapOfConcept)
          .onChange(async (value) => {
            this.plugin.settings.GenerateRootMapOfConcept = value;
            this.plugin.saveSettings();
          })
      });

       new Setting(containerEl)
      .setName('Root map of concept name')
      .setDesc('Name of the file to be used as root (if applicable)')
      .addText(text => text
        .setPlaceholder('root')
        .setValue(this.plugin.settings.RootMapOfConceptName)
        .onChange(async (value) => {
          this.plugin.settings.RootMapOfConceptName = value;
          await this.plugin.saveSettings();
        })

      );

    new Setting(containerEl)
      .setName('Remove extra bases')
      .setDesc("Whether to remove bases in the map of concept folder that do not match to other folders.\nWARNING: THIS IS A DESTRUCTIVE OPERATION.")
      .addToggle(cb => {
        cb
          .setValue(this.plugin.settings.RemoveExtraBases)
          .onChange(async (value) => {
            this.plugin.settings.RemoveExtraBases = value;
            this.plugin.saveSettings();
          })
      });
  }
}
