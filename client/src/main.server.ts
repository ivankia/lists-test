import { createApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';

const bootstrap = () => createApplication(AppComponent, config);

export default bootstrap;
