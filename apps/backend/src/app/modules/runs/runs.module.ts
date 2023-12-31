import { forwardRef, Module } from '@nestjs/common';
import { DbModule } from '../database/db.module';
import { FileStoreModule } from '../filestore/file-store.module';
import { SteamModule } from '../steam/steam.module';
import { MapsModule } from '../maps/maps.module';
import { LeaderboardRunsService } from './leaderboard-runs.service';
import { PastRunsService } from './past-runs.service';
import { RunsController } from './runs.controller';

@Module({
  imports: [
    DbModule.forRoot(),
    forwardRef(() => MapsModule),
    FileStoreModule,
    SteamModule
  ],
  providers: [LeaderboardRunsService, PastRunsService],
  exports: [LeaderboardRunsService, PastRunsService],
  controllers: [RunsController]
})
export class RunsModule {}
