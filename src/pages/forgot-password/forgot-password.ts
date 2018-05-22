import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
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
    this.loginProvider.forgotPassword(passwordForgotForm.value).subscribe((data) => this.navCtrl.setRoot(LoginPage))
  }
}
