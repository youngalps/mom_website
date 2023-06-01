import {
  ImATeapotException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { Prisma, Rank } from '@prisma/client';
import { MapsRepoService } from '../repo/maps-repo.service';
import { RunsRepoService } from '../repo/runs-repo.service';
import { SteamService } from '../steam/steam.service';
import {
  DtoFactory,
  MapRankGetNumberQueryDto,
  MapRanksGetQueryDto,
  PagedResponseDto,
  RankDto
} from '@momentum/backend/dto';

@Injectable()
export class RanksService {
  constructor(
    private readonly runRepo: RunsRepoService,
    private readonly mapRepo: MapsRepoService,
    private readonly steamService: SteamService
  ) {}
  async getRanks(
    mapID: number,
    query: MapRanksGetQueryDto
  ): Promise<PagedResponseDto<RankDto>> {
    const map = await this.mapRepo.get(mapID);

    if (!map) throw new NotFoundException('Map not found');

    const where: Prisma.RankWhereInput = {
      mapID: mapID,
      flags: query.flags
    };

    if (query.playerID) where.userID = query.playerID;
    if (query.playerIDs) where.userID = { in: query.playerIDs };

    const include = { run: true, user: true };

    const order: Prisma.RankOrderByWithAggregationInput = {};
    if (query.orderByDate !== undefined)
      order.createdAt = query.orderByDate ? 'desc' : 'asc';
    else order.rank = 'asc';

    const dbResponse = await this.runRepo.getRanks(
      where,
      include,
      undefined,
      order,
      query.skip,
      query.take
    );

    if (!dbResponse) throw new NotFoundException('No ranks found for map');

    this.formatRanksDbResponse(dbResponse[0]);

    return new PagedResponseDto(RankDto, dbResponse);
  }

  async getRankNumber(
    mapID: number,
    rankNumber: number,
    query: MapRankGetNumberQueryDto
  ): Promise<RankDto> {
    const map = await this.mapRepo.get(mapID);

    if (!map) throw new NotFoundException('Map not found');

    const where: Prisma.RankWhereInput = {
      mapID: mapID,
      rank: rankNumber,
      flags: 0,
      run: {
        trackNum: 0,
        zoneNum: 0
      }
    };

    if (query.flags) where.flags = query.flags;
    if (query.trackNum) where.run.trackNum = query.trackNum;
    if (query.zoneNum) where.run.zoneNum = query.zoneNum;

    const include = { run: true, user: true };

    const dbResponse = (await this.runRepo.getRank(where, include)) as any;

    if (!dbResponse) throw new NotFoundException('Rank not found');

    // Same approach as formatRanksDbResponse
    dbResponse.trackNum = (dbResponse as any).run.trackNum;
    dbResponse.zoneNum = (dbResponse as any).run.zoneNum;

    return DtoFactory(RankDto, dbResponse);
  }

  async getRankAround(
    userID: number,
    mapID: number,
    query: MapRankGetNumberQueryDto
  ): Promise<RankDto[]> {
    const where: Prisma.RankWhereInput = {
      mapID: mapID,
      flags: 0,
      userID: userID,
      run: {
        trackNum: 0,
        zoneNum: 0
      }
    };

    if (query.flags) where.flags = query.flags;
    if (query.trackNum) where.run.trackNum = query.trackNum;
    if (query.zoneNum) where.run.zoneNum = query.zoneNum;

    const include = { run: true, user: true };

    const order: Prisma.RankOrderByWithAggregationInput = { rank: 'asc' };

    const userRankInfo = await this.runRepo.getRank(where, include);

    if (!userRankInfo) throw new NotFoundException('No personal best found');

    const userRank = userRankInfo.rank;

    // Reuse the previous query
    where.userID = undefined;

    // Don't care about the count
    const [ranks] = await this.runRepo.getRanks(
      where,
      include,
      undefined,
      order,
      // Minus 6 here because offset will skip the number of rows provided
      // Example: if you want to offset to rank 9, you set offset to 8
      Math.max(userRank - 6, 0),
      11 // 5 + yours + 5
    );

    this.formatRanksDbResponse(ranks);

    return ranks.map((rank) => DtoFactory(RankDto, rank));
  }

  async getRankFriends(
    steamID: bigint,
    mapID: number,
    query: MapRankGetNumberQueryDto
  ): Promise<RankDto[]> {
    const map = await this.mapRepo.get(mapID);

    if (!map) throw new NotFoundException('Map not found');

    const steamFriends = await this.steamService.getSteamFriends(steamID);

    if (steamFriends.length === 0)
      throw new ImATeapotException('No friends detected :(');

    const friendSteamIDs = steamFriends.map((item) => BigInt(item.steamid));

    const where: Prisma.RankWhereInput = {
      mapID: mapID,
      flags: 0,
      user: { steamID: { in: friendSteamIDs } },
      run: { trackNum: 0, zoneNum: 0 }
    };

    if (query.flags) where.flags = query.flags;
    if (query.trackNum) where.run.trackNum = query.trackNum;
    if (query.zoneNum) where.run.zoneNum = query.zoneNum;

    const include = { run: true, user: true };

    // Don't care about the count
    const [ranks] = await this.runRepo.getRanks(where, include);

    this.formatRanksDbResponse(ranks);

    return ranks.map((rank) => DtoFactory(RankDto, rank));
  }

  // This is done because the MapRankDto still contains trackNum and zoneNum to conform to old API
  // but Rank model doesn't. Probably worth changing frontend/game code in future.
  private formatRanksDbResponse(
    ranks: (Rank & { trackNum?: any; zoneNum?: any })[]
  ) {
    for (const mapRank of ranks) {
      mapRank.trackNum = (mapRank as any).run.trackNum;
      mapRank.zoneNum = (mapRank as any).run.zoneNum;
    }
  }
}