CREATE TABLE `AccList` (
  `AccModel` varchar(255) UNIQUE,
  `AccModelCode` varchar(255) NOT NULL,
  `AccType` varchar(255) NOT NULL,
  `AccMaker` varchar(255),
  `AccMakerCode` char(1) NOT NULL,
  `AccSize` varchar(255),
  `AccStatus` int NOT NULL,
  PRIMARY KEY (`AccModelCode`, `AccType`, `AccMakerCode`)
);

CREATE TABLE `ActTypeList` (
  `ActType` varchar(255) UNIQUE,
  `ActTypeCode` char(1) PRIMARY KEY NOT NULL
);

CREATE TABLE `ActSeriesList` (
  `ActSeries` varchar(255),
  `ActSeriesCode` char(1) PRIMARY KEY NOT NULL
);

CREATE TABLE `ActSizeList` (
  `ActSeriesCode` char(1) NOT NULL,
  `ActSize` varchar(255) UNIQUE,
  `ActSizeCode` char(1) NOT NULL,
  PRIMARY KEY (`ActSeriesCode`, `ActSizeCode`)
);

CREATE TABLE `ActHWList` (
  `HW` varchar(255) UNIQUE,
  `HWCode` char(1) PRIMARY KEY NOT NULL
);

CREATE TABLE `BodyBonnetList` (
  `BonnetType` varchar(255) UNIQUE,
  `BonnetCode` char(1) PRIMARY KEY NOT NULL
);

CREATE TABLE `BodyValveList` (
  `ValveSeries` varchar(255) UNIQUE,
  `ValveSeriesCode` char(1) PRIMARY KEY NOT NULL
);

CREATE TABLE `BodyMatList` (
  `BodyMat` varchar(255) UNIQUE,
  `BodyMatCode` char(1) PRIMARY KEY NOT NULL
);

CREATE TABLE `BodyTrimSizeList` (
  `SizeUnit` varchar(255) NOT NULL UNIQUE,
  `BodySize` varchar(255) UNIQUE,
  `BodySizeCode` char(1) NOT NULL,
  PRIMARY KEY (`SizeUnit`, `BodySizeCode`)
);

CREATE TABLE `BodyRatingList` (
  `RatingUnit` varchar(255) UNIQUE,
  `Rating` varchar(255) UNIQUE,
  `RatingCode` char(1) PRIMARY KEY NOT NULL
);

CREATE TABLE `BodyConnectionList` (
  `Connection` varchar(255) UNIQUE,
  `ConnectiionCode` char(1) PRIMARY KEY NOT NULL
);

CREATE TABLE `TrimtypeList` (
  `TrimType` varchar(255) UNIQUE,
  `TrimTypeCode` char(1) PRIMARY KEY NOT NULL
);

CREATE TABLE `TrimSeriesList` (
  `TrimSeries` varchar(255) UNIQUE,
  `TrimSeriesCode` char(1) PRIMARY KEY NOT NULL
);

CREATE TABLE `TrimMatList` (
  `TimMat` varchar(255) UNIQUE,
  `TrimMatCode` char(1) PRIMARY KEY NOT NULL
);

CREATE TABLE `TrimPortSizeList` (
  `TrimPortSizeUnit` varchar(255) NOT NULL,
  `TrimPortSize` varchar(255) UNIQUE,
  `TrimPortSizeCode` char(1) NOT NULL,
  PRIMARY KEY (`TrimPortSizeUnit`, `TrimPortSizeCode`)
);

CREATE TABLE `TrimFormList` (
  `TrimForm` varchar(255) UNIQUE,
  `TrimFormCode` char(1) PRIMARY KEY NOT NULL
);

CREATE TABLE `TrimOptionList` (
  `TrimOption` varchar(255) PRIMARY KEY NOT NULL
);

CREATE TABLE `DataSheetLv3` (
  `EstimateNo` varchar(255) NOT NULL,
  `SheetID` int NOT NULL,
  `Medium` varchar(255),
  `Fluid` varchar(255),
  `IsQM` boolean,
  `FlowRateUnit` varchar(255),
  `FlowRateMaxQ` decimal,
  `FlowRateNorQ` decimal,
  `FlowRateMinQ` decimal,
  `IsP1` boolean,
  `PressureUnit` varchar(255),
  `InletPressureMaxQ` decimal,
  `InletPressureNorQ` decimal,
  `InletPressureMinQ` decimal,
  `OutletPressureMaxQ` decimal,
  `OutletPressureNorQ` decimal,
  `OutletPressureMinQ` decimal,
  `DifferentialPressureMaxQ` decimal,
  `DifferentialPressureNorQ` decimal,
  `DifferentialPressureMinQ` decimal,
  `InletTemperatureUnit` varchar(255),
  `InletTemperatureQ` decimal,
  `InletTemperatureNorQ` decimal,
  `InletTemperatureMinQ` decimal,
  `DensityUnit` varchar(255),
  `Density` decimal,
  `MolecularWeightUnit` varchar(255),
  `MolecularWeightMaxQ` decimal,
  `MolecularWeightNorQ` decimal,
  `MolecularWeightMinQ` decimal,
  `CalculatedCvUnit` varchar(255),
  `CalculatedCvMaxQ` decimal,
  `CalculatedCvNorQ` decimal,
  `CalculatedCvMinQ` decimal,
  `SS100Max` decimal,
  `SS100Nor` decimal,
  `SS100Min` decimal,
  `U1Unit` varchar(255),
  `U1Max` decimal,
  `U1Nor` decimal,
  `U1Min` decimal,
  `U2Max` decimal,
  `U2Nor` decimal,
  `U2Min` decimal,
  `LpAeMax` decimal,
  `LpAeNor` decimal,
  `LpAeMin` decimal,
  `WarningStateMax` varchar(255),
  `WarningStateNor` varchar(255),
  `WarningStateMin` varchar(255),
  `WarningTypeMax` varchar(255),
  `WarningTypeNor` varchar(255),
  `WarningTypeMin` varchar(255),
  `FluidPUnit` varchar(255),
  `FluidP1Max` decimal,
  `FluidP1Nor` decimal,
  `FluidP1Min` decimal,
  `FluidP2Max` decimal,
  `FluidP2Nor` decimal,
  `FluidP2Min` decimal,
  `IsN1` boolean,
  `FluidN1Max` decimal,
  `FluidN1Nor` decimal,
  `FluidN1Min` decimal,
  `FluidN1Unit` varchar(255),
  `FluidV1Max` decimal,
  `Fluidv1Nor` decimal,
  `FluidV1Min` decimal,
  `FluidV1Unit` varchar(255),
  `FluidPV1Max` decimal,
  `FluidPV1Nor` decimal,
  `FluidPV1Min` decimal,
  `FluidPV1Unit` varchar(255),
  `FluidTV1Max` decimal,
  `FluidTV1Nor` decimal,
  `FluidTV1Min` decimal,
  `FluidTV1Unit` varchar(255),
  `FluidCF1Max` decimal,
  `FluidCF1Nor` decimal,
  `FluidCF1Min` decimal,
  `FluidCF1Unit` varchar(255),
  `ValveType` varchar(255),
  `FlowDirection` varchar(255),
  `ValvePerformClass` varchar(255),
  `Protection` varchar(255),
  `BasicCharacter` varchar(255),
  `TheoreticalRangeability` decimal,
  `FlowCoeffUnit` varchar(255),
  `FlowCoeff` decimal,
  `NorFlowCoeff` decimal,
  `SizePressureClass` varchar(255),
  `SuggestedValveSize` varchar(255),
  `SelectedValveSize` varchar(255),
  `PressureClass` varchar(255),
  `BonnetType` varchar(255),
  `BodyMat` varchar(255),
  `BodySizeUnit` varchar(255),
  `BodySize` varchar(255),
  `RatingUnit` varchar(255),
  `Rating` varchar(255),
  `Connection` varchar(255),
  `TrimType` varchar(255),
  `TrimSeries` varchar(255),
  `TimMat` varchar(255),
  `TrimOption` varchar(255),
  `TrimPortSize` varchar(255),
  `TrimForm` varchar(255),
  `ActType` varchar(255),
  `ActSize` varchar(255),
  `HW` varchar(255),
  `PosName` varchar(255),
  `SolName` varchar(255),
  `LimName` varchar(255),
  `ASName` varchar(255),
  `VolName` varchar(255),
  `AirOpName` varchar(255),
  `LockupName` varchar(255),
  `SnapActName` varchar(255),
  PRIMARY KEY (`EstimateNo`, `SheetID`)
);

CREATE TABLE `EstimateRequest` (
  `EstimateNo` varchar(255) NOT NULL,
  `SheetID` int NOT NULL,
  `SheetNo` int NOT NULL,
  `ValveType` varchar(255),
  `Tagno` varchar(255) NOT NULL,
  `Project` varchar(255),
  `UnitPrice` int,
  `Qty` int,
  `Medium` varchar(255),
  `Fluid` varchar(255),
  `IsQM` boolean,
  `FlowRateUnit` varchar(255),
  `FlowRateMaxQ` decimal,
  `FlowRateNorQ` decimal,
  `FlowRateMinQ` decimal,
  `IsP1` boolean,
  `InletPressureUnit` varchar(255),
  `InletPressureMaxQ` decimal,
  `InletPressureNorQ` decimal,
  `InletPressureMinQ` decimal,
  `OutletPressureUnit` varchar(255),
  `OutletPressureMaxQ` decimal,
  `OutletPressureNorQ` decimal,
  `OutletPressureMinQ` decimal,
  `DifferentialPressureUnit` varchar(255),
  `DifferentialPressureMaxQ` decimal,
  `DifferentialPressureNorQ` decimal,
  `DifferentialPressureMinQ` decimal,
  `InletTemperatureUnit` varchar(255),
  `InletTemperatureQ` decimal,
  `InletTemperatureNorQ` decimal,
  `InletTemperatureMinQ` decimal,
  `DensityUnit` varchar(255),
  `DensityMaxQ` decimal,
  `DensityNorQ` decimal,
  `DensityMinQ` decimal,
  `MolecularWeightUnit` varchar(255),
  `MolecularWeight` decimal,
  `BodySizeUnit` varchar(255),
  `BodySize` varchar(255),
  `BodyMat` varchar(255),
  `TrimMat` varchar(255),
  `TrimOption` varchar(255),
  `BodyRatingUnit` varchar(255),
  `BodyRating` varchar(255),
  `ActType` varchar(255),
  `IsHW` boolean,
  `IsPositioner` boolean,
  `PositionerType` varchar(255),
  `ExplosionProof` varchar(255),
  `IsTransmitter` boolean,
  `IsSolenoid` boolean,
  `IsLimSwitch` boolean,
  `IsAirSet` boolean,
  `IsVolumeBooster` boolean,
  `IsAirOperated` boolean,
  `IsLockUp` boolean,
  `IsSnapActingRelay` boolean,
  `CustomerRequirement` varchar(255),
  PRIMARY KEY (`EstimateNo`, `SheetID`)
);

CREATE TABLE `EstimateSheetLv1` (
  `CurEstimateNo` varchar(255) PRIMARY KEY NOT NULL,
  `PrevEstimateNo` varchar(255),
  `CustomerID` varchar(255),
  `WriterID` varchar(255),
  `ManagerID` varchar(255),
  `Status` int NOT NULL,
  `StaffComment` varchar(255)
);

CREATE TABLE `User` (
  `UserID` varchar(255) PRIMARY KEY NOT NULL,
  `Password` varchar(255) NOT NULL,
  `CompanyName` varchar(255) NOT NULL,
  `CompanyPhone` varchar(255) NOT NULL,
  `RoleID` int NOT NULL,
  `Position` varchar(255) NOT NULL,
  `Department` varchar(255) NOT NULL,
  `Name` varchar(255) NOT NULL,
  `BusinessNumber` varchar(255) NOT NULL,
  `Address` varchar(255) NOT NULL,
  `Email` varchar(255) UNIQUE NOT NULL,
  `PhoneNumber` varchar(255) UNIQUE NOT NULL,
  `IsApproved` boolean NOT NULL DEFAULT false
);

CREATE TABLE `Role` (
  `RoleID` int PRIMARY KEY NOT NULL,
  `RoleName` varchar(255) NOT NULL,
  `Description` varchar(255)
);

-- 외래키 제약조건
ALTER TABLE `EstimateRequest` ADD FOREIGN KEY (`EstimateNo`) REFERENCES `EstimateSheetLv1` (`CurEstimateNo`);
ALTER TABLE `EstimateRequest` ADD FOREIGN KEY (`ValveType`) REFERENCES `BodyValveList` (`ValveSeries`);
ALTER TABLE `EstimateRequest` ADD FOREIGN KEY (`BodySizeUnit`) REFERENCES `BodyTrimSizeList` (`SizeUnit`);
ALTER TABLE `EstimateRequest` ADD FOREIGN KEY (`BodySize`) REFERENCES `BodyTrimSizeList` (`BodySize`);
ALTER TABLE `EstimateRequest` ADD FOREIGN KEY (`BodyMat`) REFERENCES `BodyMatList` (`BodyMat`);
ALTER TABLE `EstimateRequest` ADD FOREIGN KEY (`TrimMat`) REFERENCES `TrimMatList` (`TimMat`);
ALTER TABLE `EstimateRequest` ADD FOREIGN KEY (`TrimOption`) REFERENCES `TrimOptionList` (`TrimOption`);
ALTER TABLE `EstimateRequest` ADD FOREIGN KEY (`BodyRatingUnit`) REFERENCES `BodyRatingList` (`RatingUnit`);
ALTER TABLE `EstimateRequest` ADD FOREIGN KEY (`BodyRating`) REFERENCES `BodyRatingList` (`Rating`);

ALTER TABLE `EstimateSheetLv1` ADD FOREIGN KEY (`CustomerID`) REFERENCES `User` (`UserID`);
ALTER TABLE `EstimateSheetLv1` ADD FOREIGN KEY (`WriterID`) REFERENCES `User` (`UserID`);
ALTER TABLE `EstimateSheetLv1` ADD FOREIGN KEY (`ManagerID`) REFERENCES `User` (`UserID`);

ALTER TABLE `User` ADD FOREIGN KEY (`RoleID`) REFERENCES `Role` (`RoleID`);

-- DataSheetLv3 외래키 제약조건
ALTER TABLE `DataSheetLv3` ADD FOREIGN KEY (`EstimateNo`, `SheetID`) REFERENCES `EstimateRequest` (`EstimateNo`, `SheetID`);
ALTER TABLE `DataSheetLv3` ADD FOREIGN KEY (`ValveType`) REFERENCES `BodyValveList` (`ValveSeries`);
ALTER TABLE `DataSheetLv3` ADD FOREIGN KEY (`BonnetType`) REFERENCES `BodyBonnetList` (`BonnetType`);
ALTER TABLE `DataSheetLv3` ADD FOREIGN KEY (`BodyMat`) REFERENCES `BodyMatList` (`BodyMat`);
ALTER TABLE `DataSheetLv3` ADD FOREIGN KEY (`BodySizeUnit`) REFERENCES `BodyTrimSizeList` (`SizeUnit`);
ALTER TABLE `DataSheetLv3` ADD FOREIGN KEY (`BodySize`) REFERENCES `BodyTrimSizeList` (`BodySize`);
ALTER TABLE `DataSheetLv3` ADD FOREIGN KEY (`Rating`) REFERENCES `BodyRatingList` (`Rating`);
ALTER TABLE `DataSheetLv3` ADD FOREIGN KEY (`Connection`) REFERENCES `BodyConnectionList` (`Connection`);
ALTER TABLE `DataSheetLv3` ADD FOREIGN KEY (`TrimType`) REFERENCES `TrimtypeList` (`TrimType`);
ALTER TABLE `DataSheetLv3` ADD FOREIGN KEY (`TrimSeries`) REFERENCES `TrimSeriesList` (`TrimSeries`);
ALTER TABLE `DataSheetLv3` ADD FOREIGN KEY (`TimMat`) REFERENCES `TrimMatList` (`TimMat`);
ALTER TABLE `DataSheetLv3` ADD FOREIGN KEY (`TrimOption`) REFERENCES `TrimOptionList` (`TrimOption`);
ALTER TABLE `DataSheetLv3` ADD FOREIGN KEY (`TrimPortSize`) REFERENCES `TrimPortSizeList` (`TrimPortSize`);
ALTER TABLE `DataSheetLv3` ADD FOREIGN KEY (`TrimForm`) REFERENCES `TrimFormList` (`TrimForm`);
ALTER TABLE `DataSheetLv3` ADD FOREIGN KEY (`ActType`) REFERENCES `ActTypeList` (`ActType`);
ALTER TABLE `DataSheetLv3` ADD FOREIGN KEY (`ActSize`) REFERENCES `ActSizeList` (`ActSize`);
ALTER TABLE `DataSheetLv3` ADD FOREIGN KEY (`HW`) REFERENCES `ActHWList` (`HW`);
ALTER TABLE `DataSheetLv3` ADD FOREIGN KEY (`PosName`) REFERENCES `AccList` (`AccModel`);
ALTER TABLE `DataSheetLv3` ADD FOREIGN KEY (`SolName`) REFERENCES `AccList` (`AccModel`);
ALTER TABLE `DataSheetLv3` ADD FOREIGN KEY (`LimName`) REFERENCES `AccList` (`AccModel`);
ALTER TABLE `DataSheetLv3` ADD FOREIGN KEY (`ASName`) REFERENCES `AccList` (`AccModel`);
ALTER TABLE `DataSheetLv3` ADD FOREIGN KEY (`VolName`) REFERENCES `AccList` (`AccModel`);
ALTER TABLE `DataSheetLv3` ADD FOREIGN KEY (`AirOpName`) REFERENCES `AccList` (`AccModel`);
ALTER TABLE `DataSheetLv3` ADD FOREIGN KEY (`LockupName`) REFERENCES `AccList` (`AccModel`);
ALTER TABLE `DataSheetLv3` ADD FOREIGN KEY (`SnapActName`) REFERENCES `AccList` (`AccModel`);
