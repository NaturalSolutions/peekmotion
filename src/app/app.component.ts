import { Component, HostBinding } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { Keyboard } from 'ionic-angular';
import { HomePage } from '../pages/home/home';
import { LoginPage } from '../pages/login/login';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Insomnia } from '@ionic-native/insomnia';
import { AndroidPermissions } from '@ionic-native/android-permissions';
import { Subscription } from 'rxjs';
import { NFC } from '@ionic-native/nfc';
@Component({
  templateUrl: 'app.html'
})
export class MyApp {

  rootPage: any;
  private intSub: Subscription;

  @HostBinding('class.is-keyboard-open') get isKeyboardOpen() {
    return this.keyboard.isOpen();
  };

  constructor(
    private platform: Platform,
    statusBar: StatusBar,
    splashScreen: SplashScreen,
    private insomnia: Insomnia,
    private androidPermissions: AndroidPermissions,
    private nfc: NFC,
    private keyboard: Keyboard
  ) {
    this.platform.registerBackButtonAction(null)
    platform.ready().then(() => {
      this.insomnia.keepAwake()
        .then(
          () => console.log('success'),
          () => console.log('error')
        );
      statusBar.styleDefault();
      splashScreen.hide();

      if (this.platform.is('android'))
        this.intSub = this.nfc.addNdefListener((e) => {
          console.log('successfully attached ndef listener appp', e);
        }, (err) => {
          console.log('error attaching ndef listener appp', err);
        })
          .subscribe(event => {
            console.log("nfcListener in appp: ", event);
          })

      this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.ACCESS_COARSE_LOCATION);
      const token = JSON.parse(localStorage.getItem("peekmotionCurrentUser"));
      if (!token) {
        this.intSub.unsubscribe();
        this.rootPage = LoginPage
      }
      else {
        this.intSub.unsubscribe();
        let jwtHelperService: JwtHelperService = new JwtHelperService({});
        if (!jwtHelperService.isTokenExpired(token))
          this.rootPage = HomePage;
        else
          this.rootPage = LoginPage;
      }
    });
  }
}

