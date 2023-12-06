export * from './constants';
export * from './xp-systems.class';

export interface XpSystemParams {
  rankXP: RankXpParams;
  cosXP: CosXpParams;
}

export interface RankXpParams {
  top10: {
    WRPoints: number;
    rankPercentages: number[];
  };
  formula: {
    A: number;
    B: number;
  };
  groups: {
    maxGroups: number;
    groupScaleFactors: number[];
    groupExponents: number[];
    groupMinSizes: number[];
    groupPointPcts: number[]; // How much, of a % of WRPoints, does each group get
  };
}

export interface CosXpParams {
  levels: {
    maxLevels: number;
    startingValue: number;
    linearScaleBaseIncrease: number;
    linearScaleInterval: number;
    linearScaleIntervalMultiplier: number;
    staticScaleStart: number;
    staticScaleBaseMultiplier: number;
    staticScaleInterval: number;
    staticScaleIntervalMultiplier: number;
  };
  completions: {
    unique: {
      tierScale: {
        linear: number;
        staged: number;
        // bonus is static, as (tierScale.linear * (initialScale(tier3)) + tierScale.linear * (initialScale(tier4))) / 2
      };
    };
    repeat: {
      tierScale: {
        linear: number;
        staged: number;
        stages: number;
        bonus: number; // = staged
      };
    };
  };
}

export interface RankXpGain {
  rankXP: number; // The total XP gained
  formula: number; // The XP gained from formula points
  top10: number; // The XP gained from Top10 points
  group: {
    groupXP: number; // The XP gained from group calculation
    groupNum: number; // What group they're in
  };
}
