import { Component } from '@angular/core';
import { NavController, NavParams ,AlertController} from 'ionic-angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoginProvider } from '../../providers/loginService';
import { LoginPage } from '../login/login'

@Component({
  selector: 'page-forgot-password',
  templateUrl: 'forgot-password.html',
})
export class ForgotPasswordPage {
  passwordForgotForm: FormGroup;
  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    private fb: FormBuilder,
    private alertCtrl: AlertController,
    private loginProvider: LoginProvider,
  ) {
    this.passwordForgotForm = this.fb.group({
      Identifiant: ['', Validators.required],
    })
  }
  ionViewDidLoad() {
    console.log('ionViewDidLoad ForgotPasswordPage');
  }

  submitEmail(passwordForgotForm) {
    this.loginProvider.forgotPassword(passwordForgotForm.value)
      .timeout(40000)
      .subscribe(
        (data) => this.navCtrl.setRoot(LoginPage),
        (error) => {
          console.log("forgotPasswordErr", error);
          this.serverError()
        }
      )
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
