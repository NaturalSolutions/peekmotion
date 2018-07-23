import { Component } from '@angular/core';
import { NavController, NavParams,AlertController } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomFormValidator } from '../../shared/customFormValidator'
import { LoginProvider } from '../../providers/loginService';
import { HomePage } from '../home/home';
@Component({
  selector: 'page-new-password',
  templateUrl: 'new-password.html',
})
export class NewPasswordPage {
  newPasswordForm: FormGroup;

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    private fb: FormBuilder,
    private alertCtrl: AlertController,
    private loginProvider: LoginProvider) {
    this.newPasswordForm = this.fb.group({
      MotDePasse: ['', CustomFormValidator.password],
      confirmPassword: ['', Validators.required]
    },
      {
        validator: CustomFormValidator.MatchPassword
      })
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad NewPasswordPage');
  }

  submitPassword(newPasswordForm) {
    if (newPasswordForm.valid) {
      delete newPasswordForm.value.confirmPassword
      this.loginProvider.updatePassword(newPasswordForm.value).subscribe(
        data => { this.navCtrl.pop() },
        error => console.log("passwoedErr", error)
      )
    }
  }

  private serverError() {
    let alert = this.alertCtrl.create({
      title: 'Échec de connexion Internet',
      subTitle: 'Assurez-vous que vous êtes bien connecté à internet',
      enableBackdropDismiss: false,
      cssClass: 'alertCustomCss',
      buttons: [{
        text: 'OK',
        handler: () => {
          alert.dismiss().then(() =>
            this.navCtrl.setRoot(HomePage))
        }
      }]
    });
    alert.present();
  }

}
