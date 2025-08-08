import { getAllSettings } from '../database/settings.js';

class SettingsService {
  constructor() {
    if (!SettingsService.instance) {
      this.settings = {};
      // Do not call this.load() here; require explicit load
      SettingsService.instance = this;
    }
    return SettingsService.instance;
  }

  async load() {
    const data = await getAllSettings();
    this.settings = {};
    for (const { name, value } of data) {
      this.settings[name] = value;
    }
  }

  get(key) {
    return this.settings[key];
  }

  async reload() {
    await this.load();
  }
}

const settingsService = new SettingsService();
settingsService.load();
export default settingsService;