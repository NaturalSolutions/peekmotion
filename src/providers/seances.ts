import { Injectable } from '@angular/core';

@Injectable()
export class SeancesProvider {

  bilanStatus: boolean = false;
  homeText: string = "démarrer";
  serieID: number;
  stopedTime: number=0;
  lastCounter: number;

  constructor() {
    console.log('Hello SeancesProvider Provider');
  }

  public getBilanStatus() {
    return {
      bilanStatus: this.bilanStatus,
      homeText: this.homeText,
      serieID: this.serieID,
      stopedTime: this.stopedTime,
      lastCounter: this.lastCounter
    }
  }
  public setBilanStatus(status: boolean, homeText: string,
    serieID?, stopedTime?: number, lastCounter?: number) {
    this.bilanStatus = status;
    this.homeText = homeText;
    this.serieID = serieID;
    this.stopedTime=stopedTime;
     this.lastCounter=lastCounter;

    console.log("serieID", this.serieID);

  }
}
