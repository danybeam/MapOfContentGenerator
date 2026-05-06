import { App, PluginSettingTab, Setting } from "obsidian";

import MapOfConceptGeneratorPlugin from "./main";

export interface MapOfConceptGeneratorPluginSettings {
  MapOfConceptDirectory: string;
  MapOfConceptTemplate: string;
  ExcludeAllBases: boolean;
  ExcludeSelf: boolean;
  DeleteEmptyFoldersOnGeneration: boolean;
  GenerateOnStartup: boolean;
}

export const DEFAULT_SETTINGS: MapOfConceptGeneratorPluginSettings = {
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
  ExcludeAllBases: true,
  ExcludeSelf: true,
  DeleteEmptyFoldersOnGeneration: true,
  GenerateOnStartup: true
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

    new Setting(containerEl)
      .setName('Map of Concept template')
      .setDesc('(WIP please use regular template for now) Set the template for the map of concept')
      .addTextArea(text => text
        .setPlaceholder('Enter the folder to be used as a base')
        .setValue(this.plugin.settings.MapOfConceptTemplate)
        .onChange(async (value) => {
          this.plugin.settings.MapOfConceptTemplate = value;
          await this.plugin.saveSettings();
        })
      );

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
      .setDesc('This only affects folders under the base map of contents folder but as of right now it could delete the map of concept folder itself')
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
  }
}
