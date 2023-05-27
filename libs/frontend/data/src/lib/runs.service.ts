import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { env } from '@momentum/frontend/env';
import { Paged } from '@momentum/types';
import { Run } from '@momentum/types';

@Injectable({ providedIn: 'root' })
export class RunsService {
  constructor(private http: HttpClient) {}

  getRuns(options?: object): Observable<Paged<Run>> {
    return this.http.get<Paged<Run>>(
      env.api + '/api/runs',
      options || {}
    );
  }

  getRun(runID: string, options?: object): Observable<Run> {
    return this.http.get<Run>(env.api + '/api/runs/' + runID, options || {});
  }

  getMapRuns(mapID: number, options?: object): Observable<Paged<Run>> {
    return this.http.get<Paged<Run>>(
      `${env.api}/api/maps/${mapID}/runs`,
      options || {}
    );
  }
}