# Windows 개발자 가이드

## 🖥️ **개발 환경 설정**

### 필수 요구사항
- **Visual Studio 2022** (Community 버전 무료)
- **.NET 8.0 SDK**
- **MySQL Server** (또는 MySQL Workbench)
- **Git for Windows**

### 1. Visual Studio 2022 설치
1. [Visual Studio 다운로드](https://visualstudio.microsoft.com/ko/downloads/)
2. **ASP.NET and web development** 워크로드 선택
3. **.NET desktop development** 워크로드 선택

### 2. .NET 8.0 SDK 설치
```bash
# PowerShell에서 확인
dotnet --version
# 8.0.x가 출력되어야 함
```

### 3. MySQL 설치
1. [MySQL Community Server](https://dev.mysql.com/downloads/mysql/) 다운로드
2. 설치 시 root 비밀번호 설정 (기본값: 빈 비밀번호)
3. MySQL Workbench 설치 (선택사항)

## 🚀 **프로젝트 실행**

### 1. 프로젝트 클론
```bash
git clone https://github.com/your-username/FullAuthSystem.git
cd FullAuthSystem
```

### 2. 데이터베이스 설정
```json
// appsettings.json 수정
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=FullAuthSystemDb;User=root;Password=your_password;"
  }
}
```

### 3. 의존성 복원
```bash
dotnet restore
```

### 4. 데이터베이스 마이그레이션
```bash
dotnet ef database update
```

### 5. 애플리케이션 실행
```bash
dotnet run
```

### 6. Swagger UI 접속
```
http://localhost:5236/swagger
```

## 🔧 **개발 팁**

### Visual Studio에서 실행
1. `FullAuthSystem.sln` 파일 열기
2. **F5** 키로 디버그 실행
3. **Ctrl + F5** 키로 디버그 없이 실행

### 데이터베이스 관리
```bash
# 마이그레이션 생성
dotnet ef migrations add MigrationName

# 마이그레이션 적용
dotnet ef database update

# 마이그레이션 제거
dotnet ef migrations remove
```

### 로그 확인
```bash
# 개발 환경 로그
dotnet run --environment Development

# 로그 레벨 설정
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  }
}
```

## 🐛 **문제 해결**

### 1. 포트 충돌
```bash
# 포트 확인
netstat -ano | findstr :5236

# 프로세스 종료
taskkill /PID [프로세스ID] /F
```

### 2. MySQL 연결 오류
```bash
# MySQL 서비스 상태 확인
services.msc
# MySQL80 서비스 시작

# 또는 명령어로
net start MySQL80
```

### 3. 권한 문제
```bash
# 관리자 권한으로 PowerShell 실행
# 또는 Visual Studio를 관리자 권한으로 실행
```

## 📁 **프로젝트 구조**

```
FullAuthSystem/
├── Controllers/          # API 컨트롤러
├── Models/              # 데이터 모델
├── Data/                # 데이터베이스 컨텍스트
├── Services/            # 비즈니스 로직
├── Migrations/          # 데이터베이스 마이그레이션
└── appsettings.json    # 설정 파일
```

## 🔐 **보안 설정**

### 1. JWT Secret Key 변경
```json
{
  "JwtSettings": {
    "SecretKey": "YourSuperSecretKeyHere12345678901234567890"
  }
}
```

### 2. 이메일 서비스 설정
```json
{
  "Email": {
    "SmtpServer": "smtp.gmail.com",
    "SmtpPort": 587,
    "SmtpUser": "your-email@gmail.com",
    "SmtpPass": "your-app-password"
  }
}
```

## 📝 **코딩 컨벤션**

### 1. 네이밍 규칙
- **클래스**: PascalCase (`UserController`)
- **메서드**: PascalCase (`GetUserById`)
- **변수**: camelCase (`userId`)
- **상수**: UPPER_CASE (`MAX_RETRY_COUNT`)

### 2. 파일 구조
- **컨트롤러**: `[ControllerName]Controller.cs`
- **모델**: `[ModelName].cs`
- **DTO**: `Models/DTOs/[DtoName].cs`

## 🧪 **테스트**

### 1. 단위 테스트 실행
```bash
dotnet test
```

### 2. API 테스트
- Swagger UI 사용
- Postman 사용
- HTTP 파일 사용 (`CheckAuthTest.http`)

## 📚 **유용한 링크**

- [ASP.NET Core 공식 문서](https://docs.microsoft.com/ko-kr/aspnet/core/)
- [Entity Framework Core](https://docs.microsoft.com/ko-kr/ef/core/)
- [JWT 인증](https://docs.microsoft.com/ko-kr/aspnet/core/security/authentication/jwt-authn)
- [MySQL Connector](https://dev.mysql.com/doc/connector-net/en/)

## 🆘 **지원**

문제가 발생하면:
1. 로그 확인
2. Stack Overflow 검색
3. GitHub Issues 등록
4. 팀 리드에게 문의 