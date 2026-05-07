import { App, PluginSettingTab, Setting } from "obsidian";

import MapOfContentGeneratorPlugin from "./main";

export interface MapOfContentGeneratorPluginSettings {
  AddRibbonButton: boolean;
  MapOfContentDirectory: string;
  MapOfContentTemplate: string;
  RootMapTemplate: string;
  ExcludeAllBases: boolean;
  ExcludeSelf: boolean;
  DeleteEmptyFoldersOnGeneration: boolean;
  GenerateOnStartup: boolean;
  UpdateTemplatesOnGeneration: boolean;
  IgnoreExtrasDuringUpdate: boolean;
  GenerateRootMapOfContent: boolean;
  RootMapOfContentName: string;
  RemoveExtraBases: boolean;
}

export const DEFAULT_SETTINGS: MapOfContentGeneratorPluginSettings = {
  AddRibbonButton: true,
  MapOfContentDirectory: '',
  MapOfContentTemplate: `views:
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
  GenerateRootMapOfContent: true,
  RootMapOfContentName: "root",
  RemoveExtraBases: true
}

export class MapOfContentGeneratorPluginSettingTab extends PluginSettingTab {
  plugin: MapOfContentGeneratorPlugin;

  constructor(app: App, plugin: MapOfContentGeneratorPlugin) {
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
      .setName('Map of content base directory')
      .setDesc('Set directory to generate maps of content into')
      .addText(text => text
        .setPlaceholder('Enter the folder to be used as a base')
        .setValue(this.plugin.settings.MapOfContentDirectory)
        .onChange(async (value) => {
          this.plugin.settings.MapOfContentDirectory = value;
          await this.plugin.saveSettings();
        })

      );

    /*new Setting(containerEl)
      .setName('Map of content template')
      .setDesc('(WIP please use regular template for now) Set the template for the map of content')
      .addTextArea(text => text
        .setPlaceholder('')
        .setValue(this.plugin.settings.MapOfContentTemplate)
        .onChange(async (value) => {
          this.plugin.settings.MapOfContentTemplate = value;
          await this.plugin.saveSettings();
        })
      );*/

    /*new Setting(containerEl)
      .setName('Root map of content template')
      .setDesc('(WIP please use regular template for now) Set the template for the map of content at root')
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
      .setDesc('This only affects folders under the base map of contents folder but as of right now it could delete the map of content folder itself\nWARNING: THIS CAN AND WILL DELETE YOUR MAP OF content FOLDER IF IT IS EMPTY AFTER CLEANING THE EXTRAS')
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
      .setDesc('Whether to generate/update the map of contents on load')
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
      .setDesc("Whether to update the map of contents when they're generated\nWARNING: THIS IS A DESTRUCTIVE OPERATION AND IT WILL MODIFY ANY CUSTOM SETTINGS YOU HAVE ON YOUR BASES")
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
      .setName('Generate root Map of Content')
      .setDesc("Whether to make a special map of content that links to the other maps of contents")
      .addToggle(cb => {
        cb
          .setValue(this.plugin.settings.GenerateRootMapOfContent)
          .onChange(async (value) => {
            this.plugin.settings.GenerateRootMapOfContent = value;
            this.plugin.saveSettings();
          })
      });

       new Setting(containerEl)
      .setName('Root map of content name')
      .setDesc('Name of the file to be used as root (if applicable)')
      .addText(text => text
        .setPlaceholder('root')
        .setValue(this.plugin.settings.RootMapOfContentName)
        .onChange(async (value) => {
          this.plugin.settings.RootMapOfContentName = value;
          await this.plugin.saveSettings();
        })

      );

    new Setting(containerEl)
      .setName('Remove extra bases')
      .setDesc("Whether to remove bases in the map of content folder that do not match to other folders.\nWARNING: THIS IS A DESTRUCTIVE OPERATION.")
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
