-- 1) 악세사리 타입 리스트
CREATE TABLE AccTypeList (
  AccTypeCode CHAR(1) PRIMARY KEY,
  AccTypeName VARCHAR(50) UNIQUE NOT NULL
);

-- 2) 악세사리 메이커 리스트 (타입 포함)
CREATE TABLE AccMakerList (
  AccMakerCode CHAR(1) PRIMARY KEY,
  AccMakerName VARCHAR(100) NOT NULL,
  AccTypeCode CHAR(1) NOT NULL,
  CONSTRAINT FK_AccMaker_AccType FOREIGN KEY (AccTypeCode) REFERENCES AccTypeList(AccTypeCode) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- 3) 악세사리 모델 리스트
CREATE TABLE AccModelList (
  AccModelCode CHAR(10) PRIMARY KEY,
  AccModelName VARCHAR(255) NOT NULL,
  AccTypeCode CHAR(1) NOT NULL,
  AccMakerCode CHAR(1) NOT NULL,
  AccSize VARCHAR(255),
  AccStatus BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT FK_AccModel_AccType FOREIGN KEY (AccTypeCode) REFERENCES AccTypeList(AccTypeCode) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_AccModel_AccMaker FOREIGN KEY (AccMakerCode) REFERENCES AccMakerList(AccMakerCode) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- 4) Body 관련 테이블 예시
CREATE TABLE BodyValveList (
  ValveSeries VARCHAR(255) UNIQUE,
  ValveSeriesCode CHAR(1) PRIMARY KEY NOT NULL
);

CREATE TABLE BodyBonnetList (
  BonnetType VARCHAR(255) UNIQUE,
  BonnetCode CHAR(1) PRIMARY KEY NOT NULL
);

CREATE TABLE BodyMatList (
  BodyMat VARCHAR(255) UNIQUE,
  BodyMatCode CHAR(1) PRIMARY KEY NOT NULL
);

CREATE TABLE BodyTrimSizeList (
  SizeUnit VARCHAR(255) NOT NULL UNIQUE,
  BodySize VARCHAR(255) UNIQUE,
  BodySizeCode CHAR(1) NOT NULL,
  PRIMARY KEY (SizeUnit, BodySizeCode)
);

CREATE TABLE BodyRatingList (
  RatingUnit VARCHAR(255) UNIQUE,
  Rating VARCHAR(255) UNIQUE,
  RatingCode CHAR(1) PRIMARY KEY NOT NULL
);

CREATE TABLE BodyConnectionList (
  Connection VARCHAR(255) UNIQUE,
  ConnectionCode CHAR(1) PRIMARY KEY NOT NULL
);

-- 5) Trim 관련 테이블 예시
CREATE TABLE TrimTypeList (
  TrimType VARCHAR(255) UNIQUE,
  TrimTypeCode CHAR(1) PRIMARY KEY NOT NULL
);

CREATE TABLE TrimSeriesList (
  TrimSeries VARCHAR(255) UNIQUE,
  TrimSeriesCode CHAR(1) PRIMARY KEY NOT NULL
);

CREATE TABLE TrimMatList (
  TrimMat VARCHAR(255) UNIQUE,
  TrimMatCode CHAR(1) PRIMARY KEY NOT NULL
);

CREATE TABLE TrimPortSizeList (
  TrimPortSizeUnit VARCHAR(255) NOT NULL,
  TrimPortSize VARCHAR(255) UNIQUE,
  TrimPortSizeCode CHAR(1) NOT NULL UNIQUE,
  PRIMARY KEY (TrimPortSizeUnit, TrimPortSizeCode)
);

CREATE TABLE TrimFormList (
  TrimForm VARCHAR(255) UNIQUE,
  TrimFormCode CHAR(1) PRIMARY KEY NOT NULL
);

CREATE TABLE TrimOptionList (
  TrimOption VARCHAR(255) PRIMARY KEY NOT NULL
);

-- 6) Act 관련 테이블 예시
CREATE TABLE ActTypeList (
  ActType VARCHAR(255) UNIQUE,
  ActTypeCode CHAR(1) PRIMARY KEY NOT NULL
);

CREATE TABLE ActSeriesList (
  ActSeries VARCHAR(255),
  ActSeriesCode CHAR(1) PRIMARY KEY NOT NULL
);

CREATE TABLE ActSizeList (
  ActSeriesCode CHAR(1) NOT NULL,
  ActSize VARCHAR(255) UNIQUE,
  ActSizeCode CHAR(1) NOT NULL UNIQUE,
  PRIMARY KEY (ActSeriesCode, ActSizeCode)
);

CREATE TABLE ActHWList (
  HW VARCHAR(255) UNIQUE,
  HWCode CHAR(1) PRIMARY KEY NOT NULL
);

-- 7) Role 테이블
CREATE TABLE Role (
  RoleID INT PRIMARY KEY NOT NULL,
  RoleName VARCHAR(255) NOT NULL,
  Description VARCHAR(255)
);

-- 8) User 테이블
CREATE TABLE User (
  UserID VARCHAR(255) PRIMARY KEY NOT NULL,
  Password VARCHAR(255) NOT NULL,
  CompanyName VARCHAR(255) NOT NULL,
  CompanyPhone VARCHAR(255) NOT NULL,
  RoleID INT NOT NULL,
  Position VARCHAR(255) NOT NULL,
  Department VARCHAR(255) NOT NULL,
  Name VARCHAR(255) NOT NULL,
  BusinessNumber VARCHAR(255) NOT NULL,
  Address VARCHAR(255) NOT NULL,
  Email VARCHAR(255) UNIQUE NOT NULL,
  PhoneNumber VARCHAR(255) UNIQUE NOT NULL,
  IsApproved BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT FK_User_Role FOREIGN KEY (RoleID) REFERENCES Role(RoleID) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- 9) EstimateSheetLv1 테이블
CREATE TABLE EstimateSheetLv1 (
  TempEstimateNo VARCHAR(255) PRIMARY KEY,
  CurEstimateNo VARCHAR(255) UNIQUE NULL,
  PrevEstimateNo VARCHAR(255),
  CustomerID VARCHAR(255),
  WriterID VARCHAR(255),
  ManagerID VARCHAR(255),
  Status INT NOT NULL,
  Project VARCHAR(255),
  CustomerRequirement TEXT,
  StaffComment TEXT,
  CONSTRAINT FK_EstimateSheet_Customer FOREIGN KEY (CustomerID) REFERENCES User(UserID) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_EstimateSheet_Writer FOREIGN KEY (WriterID) REFERENCES User(UserID) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_EstimateSheet_Manager FOREIGN KEY (ManagerID) REFERENCES User(UserID) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- 10) EstimateRequest 테이블
CREATE TABLE EstimateRequest (
  EstimateNo VARCHAR(255),
  TempEstimateNo VARCHAR(255) NOT NULL,
  SheetID INT NOT NULL,
  SheetNo INT NOT NULL,
  ValveType CHAR(1),
  Tagno VARCHAR(255) NOT NULL,
  Project VARCHAR(255),
  UnitPrice INT,
  Qty INT,
  Medium VARCHAR(255),
  Fluid VARCHAR(255),
  IsQM BOOLEAN,
  FlowRateUnit VARCHAR(255),
  FlowRateMaxQ DECIMAL,
  FlowRateNorQ DECIMAL,
  FlowRateMinQ DECIMAL,
  IsP2 BOOLEAN,
  InletPressureUnit VARCHAR(255),
  InletPressureMaxQ DECIMAL,
  InletPressureNorQ DECIMAL,
  InletPressureMinQ DECIMAL,
  OutletPressureUnit VARCHAR(255),
  OutletPressureMaxQ DECIMAL,
  OutletPressureNorQ DECIMAL,
  OutletPressureMinQ DECIMAL,
  DifferentialPressureUnit VARCHAR(255),
  DifferentialPressureMaxQ DECIMAL,
  DifferentialPressureNorQ DECIMAL,
  DifferentialPressureMinQ DECIMAL,
  InletTemperatureUnit VARCHAR(255),
  InletTemperatureQ DECIMAL,
  InletTemperatureNorQ DECIMAL,
  InletTemperatureMinQ DECIMAL,
  DensityUnit VARCHAR(255),
  Density DECIMAL,
  MolecularWeightUnit VARCHAR(255),
  MolecularWeight DECIMAL,
  BodySizeUnit CHAR(1),
  BodySize VARCHAR(255),
  BodyMat CHAR(1),
  TrimMat CHAR(1),
  TrimOption VARCHAR(255),
  BodyRatingUnit CHAR(1),
  BodyRating CHAR(1),
  ActType CHAR(1),
  IsHW BOOLEAN,
  IsPositioner BOOLEAN,
  PositionerType VARCHAR(255),
  ExplosionProof VARCHAR(255),
  IsTransmitter BOOLEAN,
  IsSolenoid BOOLEAN,
  IsLimSwitch BOOLEAN,
  IsAirSet BOOLEAN,
  IsVolumeBooster BOOLEAN,
  IsAirOperated BOOLEAN,
  IsLockUp BOOLEAN,
  IsSnapActingRelay BOOLEAN,
  PRIMARY KEY (TempEstimateNo, SheetID),
  CONSTRAINT FK_EstimateRequest_TempEstimateNo FOREIGN KEY (TempEstimateNo) REFERENCES EstimateSheetLv1(TempEstimateNo) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_EstimateRequest_ValveType FOREIGN KEY (ValveType) REFERENCES BodyValveList(ValveSeriesCode) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_EstimateRequest_BodySizeUnit FOREIGN KEY (BodySizeUnit) REFERENCES BodyTrimSizeList(SizeUnit) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_EstimateRequest_BodySize FOREIGN KEY (BodySize) REFERENCES BodyTrimSizeList(BodySize) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_EstimateRequest_BodyMat FOREIGN KEY (BodyMat) REFERENCES BodyMatList(BodyMatCode) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_EstimateRequest_TrimMat FOREIGN KEY (TrimMat) REFERENCES TrimMatList(TrimMatCode) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_EstimateRequest_TrimOption FOREIGN KEY (TrimOption) REFERENCES TrimOptionList(TrimOption) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_EstimateRequest_BodyRatingUnit FOREIGN KEY (BodyRatingUnit) REFERENCES BodyRatingList(RatingUnit) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_EstimateRequest_BodyRating FOREIGN KEY (BodyRating) REFERENCES BodyRatingList(Rating) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- 11) DataSheetLv3 테이블
CREATE TABLE DataSheetLv3 (
  EstimateNo VARCHAR(255),
  TempEstimateNo VARCHAR(255) NOT NULL,
  SheetID INT NOT NULL,
  Medium VARCHAR(255),
  Fluid VARCHAR(255),
  IsQM BOOLEAN,
  FlowRateUnit VARCHAR(255),
  FlowRateMaxQ DECIMAL,
  FlowRateNorQ DECIMAL,
  FlowRateMinQ DECIMAL,
  IsP2 BOOLEAN,
  PressureUnit VARCHAR(255),
  InletPressureMaxQ DECIMAL,
  InletPressureNorQ DECIMAL,
  InletPressureMinQ DECIMAL,
  OutletPressureMaxQ DECIMAL,
  OutletPressureNorQ DECIMAL,
  OutletPressureMinQ DECIMAL,
  DifferentialPressureMaxQ DECIMAL,
  DifferentialPressureNorQ DECIMAL,
  DifferentialPressureMinQ DECIMAL,
  InletTemperatureUnit VARCHAR(255),
  InletTemperatureQ DECIMAL,
  InletTemperatureNorQ DECIMAL,
  InletTemperatureMinQ DECIMAL,
  DensityUnit VARCHAR(255),
  Density DECIMAL,
  MolecularWeightUnit VARCHAR(255),
  MolecularWeight DECIMAL,
  CalculatedCvUnit VARCHAR(255),
  CalculatedCvMaxQ DECIMAL,
  CalculatedCvNorQ DECIMAL,
  CalculatedCvMinQ DECIMAL,
  SS100Max DECIMAL,
  SS100Nor DECIMAL,
  SS100Min DECIMAL,
  U1Unit VARCHAR(255),
  U1Max DECIMAL,
  U1Nor DECIMAL,
  U1Min DECIMAL,
  U2Max DECIMAL,
  U2Nor DECIMAL,
  U2Min DECIMAL,
  LpAeMax DECIMAL,
  LpAeNor DECIMAL,
  LpAeMin DECIMAL,
  WarningStateMax VARCHAR(255),
  WarningStateNor VARCHAR(255),
  WarningStateMin VARCHAR(255),
  WarningTypeMax VARCHAR(255),
  WarningTypeNor VARCHAR(255),
  WarningTypeMin VARCHAR(255),
  FluidPUnit VARCHAR(255),
  FluidP1Max DECIMAL,
  FluidP1Nor DECIMAL,
  FluidP1Min DECIMAL,
  FluidP2Max DECIMAL,
  FluidP2Nor DECIMAL,
  FluidP2Min DECIMAL,
  IsN1 BOOLEAN,
  FluidN1Max DECIMAL,
  FluidN1Nor DECIMAL,
  FluidN1Min DECIMAL,
  FluidN1Unit VARCHAR(255),
  FluidV1Max DECIMAL,
  Fluidv1Nor DECIMAL,
  FluidV1Min DECIMAL,
  FluidV1Unit VARCHAR(255),
  FluidPV1Max DECIMAL,
  FluidPV1Nor DECIMAL,
  FluidPV1Min DECIMAL,
  FluidPV1Unit VARCHAR(255),
  FluidTV1Max DECIMAL,
  FluidTV1Nor DECIMAL,
  FluidTV1Min DECIMAL,
  FluidTV1Unit VARCHAR(255),
  FluidCF1Max DECIMAL,
  FluidCF1Nor DECIMAL,
  FluidCF1Min DECIMAL,
  FluidCF1Unit VARCHAR(255),
  ValveType CHAR(1),
  FlowDirection VARCHAR(255),
  ValvePerformClass VARCHAR(255),
  Protection VARCHAR(255),
  BasicCharacter VARCHAR(255),
  TheoreticalRangeability DECIMAL,
  FlowCoeffUnit VARCHAR(255),
  FlowCoeff DECIMAL,
  NorFlowCoeff DECIMAL,
  SizePressureClass VARCHAR(255),
  SuggestedValveSize VARCHAR(255),
  SelectedValveSize VARCHAR(255),
  PressureClass VARCHAR(255),
  BonnetType CHAR(1),
  BodyMat CHAR(1),
  BodySizeUnit CHAR(1),
  BodySize VARCHAR(255),
  RatingUnit CHAR(1),
  Rating CHAR(1),
  Connection CHAR(1),
  TrimType CHAR(1),
  TrimSeries CHAR(1),
  TimMat CHAR(1),
  TrimOption VARCHAR(255),
  TrimPortSize CHAR(1),
  TrimForm CHAR(1),
  ActType CHAR(1),
  ActSize CHAR(1),
  HW CHAR(1),
  PosCode CHAR(10),
  SolCode CHAR(10),
  LimCode CHAR(10),
  ASCode CHAR(10),
  VolCode CHAR(10),
  AirOpCode CHAR(10),
  LockupCode CHAR(10),
  SnapActCode CHAR(10),
  PRIMARY KEY (TempEstimateNo, SheetID),
  CONSTRAINT FK_DataSheetLv3_TempEstimateNo FOREIGN KEY (TempEstimateNo) REFERENCES EstimateSheetLv1(TempEstimateNo) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_DataSheetLv3_ValveType FOREIGN KEY (ValveType) REFERENCES BodyValveList(ValveSeriesCode) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_DataSheetLv3_BonnetType FOREIGN KEY (BonnetType) REFERENCES BodyBonnetList(BonnetCode) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_DataSheetLv3_BodyMat FOREIGN KEY (BodyMat) REFERENCES BodyMatList(BodyMatCode) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_DataSheetLv3_BodySizeUnit FOREIGN KEY (BodySizeUnit) REFERENCES BodyTrimSizeList(SizeUnit) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_DataSheetLv3_BodySize FOREIGN KEY (BodySize) REFERENCES BodyTrimSizeList(BodySize) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_DataSheetLv3_Rating FOREIGN KEY (Rating) REFERENCES BodyRatingList(RatingCode) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_DataSheetLv3_Connection FOREIGN KEY (Connection) REFERENCES BodyConnectionList(ConnectionCode) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_DataSheetLv3_TrimType FOREIGN KEY (TrimType) REFERENCES TrimTypeList(TrimTypeCode) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_DataSheetLv3_TrimSeries FOREIGN KEY (TrimSeries) REFERENCES TrimSeriesList(TrimSeriesCode) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_DataSheetLv3_TimMat FOREIGN KEY (TimMat) REFERENCES TrimMatList(TrimMatCode) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_DataSheetLv3_TrimOption FOREIGN KEY (TrimOption) REFERENCES TrimOptionList(TrimOption) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_DataSheetLv3_TrimPortSize FOREIGN KEY (TrimPortSize) REFERENCES TrimPortSizeList(TrimPortSizeCode) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_DataSheetLv3_TrimForm FOREIGN KEY (TrimForm) REFERENCES TrimFormList(TrimFormCode) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_DataSheetLv3_ActType FOREIGN KEY (ActType) REFERENCES ActTypeList(ActTypeCode) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_DataSheetLv3_ActSize FOREIGN KEY (ActSize) REFERENCES ActSizeList(ActSizeCode) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_DataSheetLv3_HW FOREIGN KEY (HW) REFERENCES ActHWList(HWCode) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_DataSheetLv3_PosCode FOREIGN KEY (PosCode) REFERENCES AccModelList(AccModelCode) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_DataSheetLv3_SolCode FOREIGN KEY (SolCode) REFERENCES AccModelList(AccModelCode) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_DataSheetLv3_LimCode FOREIGN KEY (LimCode) REFERENCES AccModelList(AccModelCode) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_DataSheetLv3_ASCode FOREIGN KEY (ASCode) REFERENCES AccModelList(AccModelCode) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_DataSheetLv3_VolCode FOREIGN KEY (VolCode) REFERENCES AccModelList(AccModelCode) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_DataSheetLv3_AirOpCode FOREIGN KEY (AirOpCode) REFERENCES AccModelList(AccModelCode) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_DataSheetLv3_LockupCode FOREIGN KEY (LockupCode) REFERENCES AccModelList(AccModelCode) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_DataSheetLv3_SnapActCode FOREIGN KEY (SnapActCode) REFERENCES AccModelList(AccModelCode) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- 12) EstimateAttachment 테이블
CREATE TABLE EstimateAttachment (
  AttachmentID INT AUTO_INCREMENT PRIMARY KEY,
  TempEstimateNo VARCHAR(255) NOT NULL,
  FileName VARCHAR(255) NOT NULL,
  FilePath VARCHAR(500) NOT NULL,
  FileSize INT,
  UploadDate DATETIME DEFAULT CURRENT_TIMESTAMP,
  UploadUserID VARCHAR(255),
  CONSTRAINT FK_EstimateAttachment_TempEstimateNo FOREIGN KEY (TempEstimateNo) REFERENCES EstimateSheetLv1(TempEstimateNo) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT FK_EstimateAttachment_UploadUser FOREIGN KEY (UploadUserID) REFERENCES User(UserID) ON UPDATE CASCADE ON DELETE SET NULL
);
