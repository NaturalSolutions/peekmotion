import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Conf } from '../conf';
import 'rxjs/add/operator/map';

@Injectable()
export class MachinesProvider {

  constructor(public http: HttpClient) {
    console.log('Hello MachinesProvider Provider');
  }

  getMachineByID(id) {
    return this.http.get<any[]>(Conf.apiBaseUrl + 'machine/macPhysiqueBtId/' + id);

  }
  getSerie(bleID,exerciceID) {
    return this.http.get<any[]>(Conf.apiBaseUrl + '/adherent/serie/macPhysiqueBtId/'+bleID+'/exerciceUsageId/'+exerciceID);
  }

  postSerie(serie,bleID,exerciceID) {
    return this.http.post<any[]>(Conf.apiBaseUrl + '/adherent/serie/macPhysiqueBtId/'+bleID+'/exerciceUsageId/'+exerciceID,serie);
  }

  getBilan() {
    return this.http.get<any[]>(Conf.apiBaseUrl + 'adherent/seance/bilan');
  }
}

