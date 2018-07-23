import { Component } from '@angular/core';
import { NavController, LoadingController, Loading, AlertController } from 'ionic-angular';
import { Keyboard } from 'ionic-angular';
import { LoginProvider } from '../../providers/loginService';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserProfilPage } from '../user-profil/user-profil';
import { CreatAccountPage } from '../creat-account/creat-account';
import { ForgotPasswordPage } from '../forgot-password/forgot-password';

@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
})
export class LoginPage {
  loginForm: FormGroup;
  private user;
  constructor(public navCtrl: NavController,
    private loginProvider: LoginProvider,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private fb: FormBuilder,
    private keyboard: Keyboard) {

    this.loginForm = this.fb.group({
      Identifiant: ['', Validators.required],
      MotDePasse: ['', Validators.required],
    })
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad LoginPage');
  }

  login(loginForm) {
    this.user = loginForm.value;
    let loading: Loading = this.loadingCtrl.create({
      spinner: 'crescent',
      cssClass: 'loaderCustomCss',
    });
    loading.present();
    this.loginProvider.login(this.user)
      .timeout(40000).subscribe(
        (token) => {
          loading.dismiss();
          localStorage.setItem('peekmotionCurrentUser', JSON.stringify(token));
          this.navCtrl.setRoot(UserProfilPage, { firstConnexion: true });
        },
        error => {
          loading.dismiss();
          if (error.status == 400)
            this.errorAlert()
          else
            this.serverError()
        })
  }

  errorAlert() {
    let alert = this.alertCtrl.create({
      message: "Email ou mot de passe incorrect",
      cssClass: 'alertCustomCss',
      buttons: ['OK']
    });
    alert.present();
  }
  creatAccount() {
    this.navCtrl.push(CreatAccountPage)
  }
  forgotPassword() {
    this.navCtrl.push(ForgotPasswordPage)
  }
  private serverError() {
    let alert = this.alertCtrl.create({
      title: 'Échec de connexion Internet',
      subTitle: 'Assurez-vous que vous êtes bien connecté à internet',
      enableBackdropDismiss: false,
      cssClass: 'alertCustomCss',
      buttons: ['OK']
    });
    alert.present();
  }

}
