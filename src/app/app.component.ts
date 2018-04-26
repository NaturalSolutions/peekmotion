import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { HomePage } from '../pages/home/home';
import { LoginPage } from '../pages/login/login';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Insomnia } from '@ionic-native/insomnia';
import { AndroidPermissions } from '@ionic-native/android-permissions';
@Component({
  templateUrl: 'app.html'
})
export class MyApp {

  rootPage: any;
  constructor(platform: Platform,
    statusBar: StatusBar,
    splashScreen: SplashScreen,
    private insomnia: Insomnia,
    private androidPermissions: AndroidPermissions) {

    platform.ready().then(() => {
      this.insomnia.keepAwake()
        .then(
          () => console.log('success'),
          () => console.log('error')
        );
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      statusBar.styleDefault();
      splashScreen.hide();
      this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.ACCESS_COARSE_LOCATION);
      const token = JSON.parse(localStorage.getItem("peekmotionCurrentUser"));
      if (!token)
        this.rootPage = LoginPage;
      else {
        let jwtHelperService: JwtHelperService = new JwtHelperService({});
        if (!jwtHelperService.isTokenExpired(token))
          this.rootPage = HomePage;
        else
          this.rootPage = LoginPage;
      }
    });

  }
}

