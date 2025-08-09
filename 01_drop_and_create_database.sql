-- 데이터베이스 드롭 및 재생성
DROP DATABASE IF EXISTS PWD_Final;
CREATE DATABASE PWD_Final;
USE PWD_Final;

-- 1) 악세사리 타입 리스트
CREATE TABLE AccTypeList (
  AccTypeCode CHAR(1) PRIMARY KEY,
  AccTypeName VARCHAR(50) UNIQUE NOT NULL
);

-- 2) 악세사리 메이커 리스트
CREATE TABLE AccMakerList (
  AccMakerCode CHAR(1) NOT NULL,
  AccMakerName VARCHAR(100) NOT NULL,
  AccTypeCode CHAR(1) NOT NULL,
  PRIMARY KEY (AccMakerCode, AccTypeCode),
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
  CONSTRAINT FK_AccModel_AccMaker FOREIGN KEY (AccMakerCode, AccTypeCode) REFERENCES AccMakerList(AccMakerCode, AccTypeCode) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- 4) Body 관련 테이블
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

CREATE TABLE BodySizeList (
  SizeUnit VARCHAR(255) NOT NULL,
  BodySize VARCHAR(255),
  BodySizeCode CHAR(1) NOT NULL,
  PRIMARY KEY (SizeUnit, BodySizeCode)
);

CREATE TABLE BodyRatingList (
  RatingUnit VARCHAR(255) ,
  RatingCode CHAR(1) PRIMARY KEY,
  RatingName VARCHAR(255) NOT NULL
);

CREATE TABLE BodyConnectionList (
  Connection VARCHAR(255) UNIQUE,
  ConnectionCode CHAR(1) PRIMARY KEY NOT NULL
);

-- 5) Trim 관련 테이블
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
  PortSizeCode CHAR(1) PRIMARY KEY,
  PortSizeUnit VARCHAR(255) NOT NULL,
  PortSize VARCHAR(255) NOT NULL
);

CREATE TABLE TrimFormList (
  TrimForm VARCHAR(255) UNIQUE,
  TrimFormCode CHAR(1) PRIMARY KEY NOT NULL
);

CREATE TABLE TrimOptionList (
  TrimOptionCode CHAR(1) PRIMARY KEY,
  TrimOptionName VARCHAR(255) NOT NULL
);

-- 6) Act 관련 테이블
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
  ActSize VARCHAR(255),
  ActSizeCode CHAR(1) NOT NULL,
  PRIMARY KEY (ActSeriesCode, ActSizeCode),
  CONSTRAINT FK_ActSize_ActSeries FOREIGN KEY (ActSeriesCode) REFERENCES ActSeriesList(ActSeriesCode) ON UPDATE CASCADE ON DELETE RESTRICT
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
  CONSTRAINT FK_User_Role FOREIGN KEY (RoleID)
    REFERENCES Role(RoleID) ON UPDATE CASCADE ON DELETE RESTRICT
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
  ValveType CHAR(1) NULL,
  Tagno VARCHAR(255) NOT NULL,
  UnitPrice INT,
  Qty INT,
  Medium VARCHAR(255),
  Fluid VARCHAR(255),
  IsQM BOOLEAN,
  IsP2 BOOLEAN,
  IsDensity BOOLEAN,
  IsHW BOOLEAN,
  QMUnit VARCHAR(255),
  QMMax DECIMAL(10,5),
  QMNor DECIMAL(10,5),
  QMMin DECIMAL(10,5),
  QNUnit VARCHAR(255),
  QNMax DECIMAL(10,5),
  QNNor DECIMAL(10,5),
  QNMin DECIMAL(10,5),
  InletPressureUnit VARCHAR(255),
  InletPressureMaxQ DECIMAL(10,5),
  InletPressureNorQ DECIMAL(10,5),
  InletPressureMinQ DECIMAL(10,5),
  OutletPressureUnit VARCHAR(255),
  OutletPressureMaxQ DECIMAL(10,5),
  OutletPressureNorQ DECIMAL(10,5),
  OutletPressureMinQ DECIMAL(10,5),
  DifferentialPressureUnit VARCHAR(255),
  DifferentialPressureMaxQ DECIMAL(10,5),
  DifferentialPressureNorQ DECIMAL(10,5),
  DifferentialPressureMinQ DECIMAL(10,5),
  InletTemperatureUnit VARCHAR(255),
  InletTemperatureQ DECIMAL(10,5),
  InletTemperatureNorQ DECIMAL(10,5),
  InletTemperatureMinQ DECIMAL(10,5),
  DensityUnit VARCHAR(255),
  Density DECIMAL(10,5),
  MolecularWeightUnit VARCHAR(255),
  MolecularWeight DECIMAL(10,5),
  BodySizeUnit VARCHAR(255) NULL,
  BodySize CHAR(1) NULL,
  BodyMat CHAR(1) NULL,
  TrimMat CHAR(1) NULL,
  TrimOption CHAR(1) NULL,
  BodyRating CHAR(1) NULL,
  ActType VARCHAR(255) NULL,
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

  CONSTRAINT FK_EstimateRequest_BodySize FOREIGN KEY (BodySizeUnit, BodySize) REFERENCES BodySizeList(SizeUnit, BodySizeCode) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_EstimateRequest_BodyMat FOREIGN KEY (BodyMat) REFERENCES BodyMatList(BodyMatCode) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_EstimateRequest_TrimMat FOREIGN KEY (TrimMat) REFERENCES TrimMatList(TrimMatCode) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_EstimateRequest_TrimOption FOREIGN KEY (TrimOption) REFERENCES TrimOptionList(TrimOptionCode) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_EstimateRequest_BodyRating FOREIGN KEY (BodyRating) REFERENCES BodyRatingList(RatingCode) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- 11) EstimateAttachment 테이블
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

-- 12) DataSheetLv3 테이블
CREATE TABLE DataSheetLv3 (
  EstimateNo VARCHAR(255),
  TempEstimateNo VARCHAR(255) NOT NULL,
  SheetID INT NOT NULL,
  Medium VARCHAR(255),
  Fluid VARCHAR(255),
  IsQM BOOLEAN,
  IsP2 BOOLEAN,
  IsDensity BOOLEAN,
  IsN1 BOOLEAN,
  QMUnit VARCHAR(255),
  QMMax DECIMAL(10,5),
  QMNor DECIMAL(10,5),
  QMMin DECIMAL(10,5),
  QNUnit VARCHAR(255),
  QNMax DECIMAL(10,5),
  QNNor DECIMAL(10,5),
  QNMin DECIMAL(10,5),
  PressureUnit VARCHAR(255),
  InletPressureMaxQ DECIMAL(10,5),
  InletPressureNorQ DECIMAL(10,5),
  InletPressureMinQ DECIMAL(10,5),
  OutletPressureMaxQ DECIMAL(10,5),
  OutletPressureNorQ DECIMAL(10,5),
  OutletPressureMinQ DECIMAL(10,5),
  DifferentialPressureMaxQ DECIMAL(10,5),
  DifferentialPressureNorQ DECIMAL(10,5),
  DifferentialPressureMinQ DECIMAL(10,5),
  InletTemperatureUnit VARCHAR(255),
  InletTemperatureQ DECIMAL(10,5),
  InletTemperatureNorQ DECIMAL(10,5),
  InletTemperatureMinQ DECIMAL(10,5),
  DensityUnit VARCHAR(255),
  Density DECIMAL(10,5),
  MolecularWeightUnit VARCHAR(255),
  MolecularWeight DECIMAL(10,5),
  CalculatedCvUnit VARCHAR(255),
  CalculatedCvMaxQ DECIMAL(10,5),
  CalculatedCvNorQ DECIMAL(10,5),
  CalculatedCvMinQ DECIMAL(10,5),
  SS100Max DECIMAL(10,5),
  SS100Nor DECIMAL(10,5),
  SS100Min DECIMAL(10,5),
  U1Unit VARCHAR(255),
  U1Max DECIMAL(10,5),
  U1Nor DECIMAL(10,5),
  U1Min DECIMAL(10,5),
  U2Max DECIMAL(10,5),
  U2Nor DECIMAL(10,5),
  U2Min DECIMAL(10,5),
  LpAeMax DECIMAL(10,5),
  LpAeNor DECIMAL(10,5),
  LpAeMin DECIMAL(10,5),
  WarningStateMax VARCHAR(255),
  WarningStateNor VARCHAR(255),
  WarningStateMin VARCHAR(255),
  WarningTypeMax VARCHAR(255),
  WarningTypeNor VARCHAR(255),
  WarningTypeMin VARCHAR(255),
  FluidPUnit VARCHAR(255),
  FluidP1Max DECIMAL(10,5),
  FluidP1Nor DECIMAL(10,5),
  FluidP1Min DECIMAL(10,5),
  FluidP2Max DECIMAL(10,5),
  FluidP2Nor DECIMAL(10,5),
  FluidP2Min DECIMAL(10,5),
  FluidN1Max DECIMAL(10,5),
  FluidN1Nor DECIMAL(10,5),
  FluidN1Min DECIMAL(10,5),
  FluidN1Unit VARCHAR(255),
  FluidV1Max DECIMAL(10,5),
  Fluidv1Nor DECIMAL(10,5),
  FluidV1Min DECIMAL(10,5),
  FluidV1Unit VARCHAR(255),
  FluidPV1Max DECIMAL(10,5),
  FluidPV1Nor DECIMAL(10,5),
  FluidPV1Min DECIMAL(10,5),
  FluidPV1Unit VARCHAR(255),
  FluidTV1Max DECIMAL(10,5),
  FluidTV1Nor DECIMAL(10,5),
  FluidTV1Min DECIMAL(10,5),
  FluidTV1Unit VARCHAR(255),
  FluidCF1Max DECIMAL(10,5),
  FluidCF1Nor DECIMAL(10,5),
  FluidCF1Min DECIMAL(10,5),
  FluidCF1Unit VARCHAR(255),
  FluidKMax DECIMAL(10,5),
  FluidKNor DECIMAL(10,5),
  FluidKMin DECIMAL(10,5),
  ValveType CHAR(1) NULL,
  FlowDirection VARCHAR(255),
  ValvePerformClass VARCHAR(255),
  Protection VARCHAR(255),
  BasicCharacter VARCHAR(255),
  TheoreticalRangeability DECIMAL(10,5),
  FlowCoeffUnit VARCHAR(255),
  FlowCoeff DECIMAL(10,5),
  NorFlowCoeff DECIMAL(10,5),
  SizePressureClass VARCHAR(255),
  SuggestedValveSize DECIMAL(10,5),
  BonnetType CHAR(1) NULL,
  BodyMat CHAR(1) NULL,
  BodySizeUnit VARCHAR(255),
  BodySize CHAR(1) NULL,
  Rating CHAR(1) NULL,
  Connection CHAR(1) NULL,
  TrimType CHAR(1) NULL,
  TrimSeries CHAR(1) NULL,
  TrimMat CHAR(1) NULL,
  TrimOption CHAR(1) NULL,
  TrimPortSize CHAR(1) NULL,
  TrimForm CHAR(1) NULL,
  ActType CHAR(1) NULL,
  ActSeriesCode CHAR(1) NULL,
  ActSize CHAR(1) NULL,
  HW CHAR(1) NULL,
  PosCode CHAR(10) NULL,
  SolCode CHAR(10) NULL,
  LimCode CHAR(10) NULL,
  ASCode CHAR(10) NULL,
  VolCode CHAR(10) NULL,
  AirOpCode CHAR(10) NULL,
  LockupCode CHAR(10) NULL,
  SnapActCode CHAR(10) NULL,
  PRIMARY KEY (TempEstimateNo, SheetID),
  CONSTRAINT FK_DataSheetLv3_TempEstimateNo FOREIGN KEY (TempEstimateNo) REFERENCES EstimateSheetLv1(TempEstimateNo) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_DataSheetLv3_ValveType FOREIGN KEY (ValveType) REFERENCES BodyValveList(ValveSeriesCode) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_DataSheetLv3_BonnetType FOREIGN KEY (BonnetType) REFERENCES BodyBonnetList(BonnetCode) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_DataSheetLv3_BodyMat FOREIGN KEY (BodyMat) REFERENCES BodyMatList(BodyMatCode) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_DataSheetLv3_BodySize FOREIGN KEY (BodySizeUnit, BodySize) REFERENCES BodySizeList(SizeUnit, BodySizeCode) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_DataSheetLv3_Rating FOREIGN KEY (Rating) REFERENCES BodyRatingList(RatingCode) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_DataSheetLv3_Connection FOREIGN KEY (Connection) REFERENCES BodyConnectionList(ConnectionCode) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_DataSheetLv3_TrimType FOREIGN KEY (TrimType) REFERENCES TrimTypeList(TrimTypeCode) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_DataSheetLv3_TrimSeries FOREIGN KEY (TrimSeries) REFERENCES TrimSeriesList(TrimSeriesCode) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_DataSheetLv3_TrimMat FOREIGN KEY (TrimMat) REFERENCES TrimMatList(TrimMatCode) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_DataSheetLv3_TrimOption FOREIGN KEY (TrimOption) REFERENCES TrimOptionList(TrimOptionCode) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_DataSheetLv3_TrimPortSize FOREIGN KEY (TrimPortSize) REFERENCES TrimPortSizeList(PortSizeCode) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_DataSheetLv3_TrimForm FOREIGN KEY (TrimForm) REFERENCES TrimFormList(TrimFormCode) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_DataSheetLv3_ActType FOREIGN KEY (ActType) REFERENCES ActTypeList(ActTypeCode) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT FK_DataSheetLv3_ActSize FOREIGN KEY (ActSeriesCode, ActSize) REFERENCES ActSizeList(ActSeriesCode, ActSizeCode) ON UPDATE CASCADE ON DELETE RESTRICT,
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
