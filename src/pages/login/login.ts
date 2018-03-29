import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { LoginProvider } from '../../providers/loginService';
import { AlertController } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserProfilPage } from '../user-profil/user-profil';
import { CreatAccountPage} from '../creat-account/creat-account';
import { ForgotPasswordPage} from '../forgot-password/forgot-password';

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
    private fb: FormBuilder) {

    this.loginForm = this.fb.group({
      Identifiant: ['', Validators.required],
      MotDePasse: ['', Validators.required],
    })
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad LoginPage');
  }

  login(loginForm) {
    console.log(" this.user", loginForm.value);
    this.user = loginForm.value;
    this.loginProvider.login(this.user)
      .subscribe(
        (token) => localStorage.setItem('peekmotionCurrentUser', JSON.stringify(token)),
        error => this.errorAlert(),
        () => this.navCtrl.setRoot(UserProfilPage,{firstConnexion : true})
      )
  }

  errorAlert() {
    let alert = this.alertCtrl.create({
      message: "Email ou mot de passe incorect",
      cssClass: 'alertCustomCss',
      buttons: ['OK']
    });
    alert.present();
  }
  creatAccount(){
    this.navCtrl.push(CreatAccountPage)
  }
  forgotPassword(){
    this.navCtrl.push(ForgotPasswordPage)
  }

}
