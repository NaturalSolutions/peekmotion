import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomFormValidator } from '../../shared/customFormValidator'
import { LoginProvider } from '../../providers/loginService';

@Component({
  selector: 'page-new-password',
  templateUrl: 'new-password.html',
})
export class NewPasswordPage {
  newPasswordForm: FormGroup;

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    private fb: FormBuilder,
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


}
