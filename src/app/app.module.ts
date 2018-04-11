import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { HTTP_INTERCEPTORS, HttpClientModule } from "@angular/common/http";
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { MyApp } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
//ionic native
import { NFC, Ndef } from '@ionic-native/nfc';  
import { BLE } from '@ionic-native/ble';
import { Gyroscope } from '@ionic-native/gyroscope';
import { Insomnia } from '@ionic-native/insomnia';
import { AndroidPermissions } from '@ionic-native/android-permissions';
//pages
import { HomePage } from '../pages/home/home';
import { LoginPage } from '../pages/login/login';
import { ExercicesListPage } from '../pages/exercices-list/exercices-list';
import { RecommendationPage} from '../pages/Recommendation/Recommendation';
import { UserProfilPage } from '../pages/user-profil/user-profil';
import { RepetitionPage} from '../pages/repetition/repetition';
import { CreatAccountPage} from '../pages/creat-account/creat-account';
import { ForgotPasswordPage} from '../pages/forgot-password/forgot-password';
import { BilanPage} from '../pages/bilan/bilan';
//pipe
import {FormatTimePipe } from '../pipes/format-time';
//providers
import { MachinesProvider } from '../providers/machines';
import { NfcProvider } from '../providers/nfc';
import { AuthInterceptor } from '../providers/authinterceptor';
import { LoginProvider } from '../providers/loginService';
import { SeancesProvider } from '../providers/seances';

//extraModule
import {RoundProgressModule} from 'angular-svg-round-progressbar';
import { MultiPickerModule } from 'ion-multi-picker';
import { ChartModule } from 'angular2-highcharts';
import { HighchartsStatic } from 'angular2-highcharts/dist/HighchartsService';

declare var require: any;
export function highchartsFactory() {
  var hc = require('highcharts');
  var hcm = require('highcharts/highcharts-more');
  var vp = require('highcharts/modules/variable-pie');
  hcm(hc);
  vp(hc);
  return hc;
}

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    LoginPage,
    ExercicesListPage,
    RecommendationPage,
    UserProfilPage,
    RepetitionPage,
    CreatAccountPage,
    ForgotPasswordPage,
    BilanPage,
    FormatTimePipe,
   

  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    IonicModule.forRoot(MyApp, {
      mode: 'md'
    }),
    ChartModule,
    RoundProgressModule,
    MultiPickerModule,
    BrowserAnimationsModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    LoginPage,
    ExercicesListPage,
    RecommendationPage,
    RepetitionPage,
    UserProfilPage,
    CreatAccountPage,
    ForgotPasswordPage,
    BilanPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    NFC,
    Ndef,
    Gyroscope,
    Insomnia,
    AndroidPermissions,
    BLE,
    NfcProvider,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    {
      provide: HighchartsStatic,
      useFactory: highchartsFactory
    },
    MachinesProvider,
    AuthInterceptor,
    LoginProvider,
    SeancesProvider,

  ]
})
export class AppModule {}
