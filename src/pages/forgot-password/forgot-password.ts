import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'page-forgot-password',
  templateUrl: 'forgot-password.html',
})
export class ForgotPasswordPage {
  passwordForgotForm: FormGroup;
  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    private fb: FormBuilder
  ) {
    this.passwordForgotForm = this.fb.group({
      Identifiant: ['', Validators.required],
    })
  }
  ionViewDidLoad() {
    console.log('ionViewDidLoad ForgotPasswordPage');
  }

  submitEmail(passwordForgotForm) {
    console.log(" passwordForgotForm");
    
  }
}
