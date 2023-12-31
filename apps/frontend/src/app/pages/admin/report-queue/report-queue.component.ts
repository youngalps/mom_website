import { Component, OnInit } from '@angular/core';
import { switchMap, tap } from 'rxjs/operators';
import { ReportType, Report } from '@momentum/constants';
import { MessageService } from 'primeng/api';
import { PaginatorModule } from 'primeng/paginator';
import { merge, of, Subject } from 'rxjs';
import { PaginatorState } from 'primeng/paginator/paginator.interface';
import { SpinnerDirective } from '../../../directives';
import { SharedModule } from '../../../shared.module';
import { AdminService } from '../../../services';
import { QueuedReportComponent } from './queued-report/queued-report.component';

@Component({
  selector: 'm-report-queue',
  templateUrl: './report-queue.component.html',
  standalone: true,
  imports: [
    SharedModule,
    QueuedReportComponent,
    PaginatorModule,
    SpinnerDirective
  ]
})
export class ReportQueueComponent implements OnInit {
  protected readonly ReportType = ReportType;

  reportQueue: Report[] = [];
  filters = { resolved: false };

  protected readonly rows = 5;
  protected totalRecords = 0;
  protected first = 0;

  protected loading: boolean;
  protected readonly pageChange = new Subject<PaginatorState>();
  protected readonly refresh = new Subject<void>();
  protected readonly filterChange = new Subject<void>();

  constructor(
    private readonly adminService: AdminService,
    private readonly toasterService: MessageService
  ) {}

  ngOnInit() {
    merge(
      of(null),
      this.refresh,
      this.filterChange.pipe(
        tap(() => {
          this.first = 0;
          this.totalRecords = 0;
        })
      ),
      this.pageChange.pipe(tap(({ first }) => (this.first = first)))
    )
      .pipe(
        tap(() => (this.loading = true)),
        switchMap(() =>
          this.adminService.getReports({
            expand: ['submitter', 'resolver'],
            resolved: this.filters.resolved,
            take: this.rows,
            skip: this.first
          })
        ),
        tap(() => (this.loading = false))
      )
      .subscribe({
        next: (response) => {
          this.totalRecords = response.totalCount;
          this.reportQueue = response.data;
        },
        error: (error) => {
          console.error(error);
          this.toasterService.add({
            severity: 'error',
            summary: 'Failed to load report queue',
            detail: error.message
          });
        }
      });
  }
}
