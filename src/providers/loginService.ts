import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Conf } from '../conf';

@Injectable()
export class LoginProvider {

  constructor(public http: HttpClient) {
    console.log('Hello LoginProvider Provider');
  }

  login(user) {
     return this.http.post(Conf.apiBaseUrl + 'adherent/token',user)
  }
 getUser(){
  return this.http.get(Conf.apiBaseUrl + 'adherent')
 }
 getObjectifs(){
  return this.http.get(Conf.apiBaseUrl +'adherent/objectifs')
 }
 getLevel(){
  return this.http.get(Conf.apiBaseUrl +'adherent/testNiveaux')
 }

 updateProfil(user){
  return this.http.put(Conf.apiBaseUrl +'adherent',user)
 }
}
