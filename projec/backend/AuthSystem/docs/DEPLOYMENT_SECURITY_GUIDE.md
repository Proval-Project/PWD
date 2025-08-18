# 🚀 배포 환경 보안 가이드

## ⚠️ **개발환경 vs 배포환경 보안 차이점**

### **현재 개발환경 설정 (위험한 부분들)**

#### **1. 하드코딩된 관리자 계정**
```csharp
// Program.cs - 현재 상태 (위험!)
if (!context.Users.Any(u => u.Email == "admin@example.com"))
{
    context.Users.Add(new User
    {
        UserID = "admin@example.com",
        Email = "admin@example.com",
        Name = "관리자 계정",
        Password = adminPasswordHash, // "Admin123!" 해시
        RoleID = 1
    });
}
```

#### **2. 하드코딩된 JWT Secret Key**
```json
// appsettings.json - 현재 상태 (위험!)
"JwtSettings": {
    "SecretKey": "YourSuperSecretKeyHere12345678901234567890"
}
```

#### **3. 하드코딩된 데이터베이스 연결 정보**
```json
// appsettings.json - 현재 상태 (위험!)
"ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=FullAuthSystemDb;User=root;Password=yubin1004;"
}
```

#### **4. 하드코딩된 이메일 계정 정보**
```json
// appsettings.json - 현재 상태 (위험!)
"Email": {
    "SmtpUser": "tlawlals112@gmail.com",
    "SmtpPass": "ceez hfyg nlea zjjr"
}
```

---

## 🔧 **배포환경에서 변경해야 할 항목들**

### **1. 환경변수 설정**

#### **Windows 환경변수 설정**
```powershell
# 시스템 환경변수 설정
[Environment]::SetEnvironmentVariable("ADMIN_EMAIL", "admin@yourcompany.com", "Machine")
[Environment]::SetEnvironmentVariable("ADMIN_PASSWORD", "StrongPassword123!", "Machine")
[Environment]::SetEnvironmentVariable("JWT_SECRET_KEY", "YourVeryLongSecretKeyHere123456789012345678901234567890", "Machine")
[Environment]::SetEnvironmentVariable("DB_CONNECTION_STRING", "Server=your-server;Database=your-db;User=your-user;Password=your-password;", "Machine")
[Environment]::SetEnvironmentVariable("SMTP_USER", "your-email@yourcompany.com", "Machine")
[Environment]::SetEnvironmentVariable("SMTP_PASSWORD", "your-app-password", "Machine")
```

#### **Linux/Docker 환경변수 설정**
```bash
# .env 파일 생성
ADMIN_EMAIL=admin@yourcompany.com
ADMIN_PASSWORD=StrongPassword123!
JWT_SECRET_KEY=YourVeryLongSecretKeyHere123456789012345678901234567890
DB_CONNECTION_STRING=Server=your-server;Database=your-db;User=your-user;Password=your-password;
SMTP_USER=your-email@yourcompany.com
SMTP_PASSWORD=your-app-password
```

### **2. appsettings.Production.json 생성**

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "${DB_CONNECTION_STRING}"
  },
  "JwtSettings": {
    "SecretKey": "${JWT_SECRET_KEY}",
    "Issuer": "YourCompanyAuthSystem",
    "Audience": "YourCompanyUsers",
    "ExpirationInMinutes": 60
  },
  "Email": {
    "SmtpServer": "smtp.gmail.com",
    "SmtpPort": 587,
    "SmtpUser": "${SMTP_USER}",
    "SmtpPass": "${SMTP_PASSWORD}",
    "From": "${SMTP_USER}",
    "EnableSsl": true
  },
  "AdminAccount": {
    "Email": "${ADMIN_EMAIL}",
    "Password": "${ADMIN_PASSWORD}",
    "Name": "시스템 관리자"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Warning",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "yourdomain.com"
}
```

### **3. Program.cs 수정**

```csharp
// 개발환경과 운영환경 분리
if (app.Environment.IsDevelopment())
{
    // 개발환경: 기본 관리자 계정 생성 허용
    if (!context.Users.Any(u => u.Email == "admin@example.com"))
    {
        var adminPassword = Environment.GetEnvironmentVariable("ADMIN_PASSWORD") ?? "Admin123!";
        // ... 개발용 관리자 생성
    }
}
else
{
    // 운영환경: 환경변수 필수
    var adminEmail = Environment.GetEnvironmentVariable("ADMIN_EMAIL");
    var adminPassword = Environment.GetEnvironmentVariable("ADMIN_PASSWORD");
    
    if (string.IsNullOrEmpty(adminEmail) || string.IsNullOrEmpty(adminPassword))
    {
        throw new InvalidOperationException("운영환경에서는 ADMIN_EMAIL과 ADMIN_PASSWORD 환경변수가 필요합니다.");
    }
    
    // 운영환경 관리자 계정 생성
    if (!context.Users.Any(u => u.Email == adminEmail))
    {
        // ... 운영용 관리자 생성
    }
}
```

---

## 🛡️ **보안 체크리스트**

### **배포 전 확인사항**

- [ ] **환경변수 설정**
  - [ ] ADMIN_EMAIL 설정
  - [ ] ADMIN_PASSWORD 설정 (강력한 비밀번호)
  - [ ] JWT_SECRET_KEY 설정 (최소 32자 이상)
  - [ ] DB_CONNECTION_STRING 설정
  - [ ] SMTP_USER, SMTP_PASSWORD 설정

- [ ] **데이터베이스 보안**
  - [ ] 강력한 데이터베이스 비밀번호
  - [ ] 데이터베이스 사용자 권한 제한
  - [ ] SSL 연결 설정

- [ ] **네트워크 보안**
  - [ ] HTTPS 설정
  - [ ] 방화벽 설정
  - [ ] 포트 제한

- [ ] **애플리케이션 보안**
  - [ ] CORS 설정 제한
  - [ ] 로깅 레벨 조정
  - [ ] 에러 메시지 민감 정보 제거

### **운영 중 보안 관리**

- [ ] **정기적인 비밀번호 변경**
  - [ ] 관리자 계정 비밀번호 (월 1회)
  - [ ] 데이터베이스 비밀번호 (분기 1회)
  - [ ] JWT Secret Key (분기 1회)

- [ ] **모니터링**
  - [ ] 접근 로그 확인
  - [ ] 비정상 로그인 시도 감지
  - [ ] 시스템 리소스 모니터링

- [ ] **백업**
  - [ ] 데이터베이스 정기 백업
  - [ ] 설정 파일 백업
  - [ ] 로그 파일 백업

---

## 🚨 **주의사항**

### **1. 절대 하드코딩 금지**
```csharp
// ❌ 절대 하지 말 것
var secretKey = "YourSuperSecretKeyHere12345678901234567890";
var adminPassword = "Admin123!";
```

### **2. 소스코드에 민감한 정보 포함 금지**
- 비밀번호, API 키, 연결 문자열 등
- Git 저장소에 커밋 금지
- .gitignore에 민감한 파일 추가

### **3. 운영환경 로그 설정**
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Warning",
      "Microsoft.AspNetCore": "Warning"
    }
  }
}
```

---

## 📋 **배포 스크립트 예시**

### **Windows 배포 스크립트**
```powershell
# deploy.ps1
Write-Host "배포 환경 설정 중..."

# 환경변수 설정
[Environment]::SetEnvironmentVariable("ADMIN_EMAIL", "admin@yourcompany.com", "Machine")
[Environment]::SetEnvironmentVariable("ADMIN_PASSWORD", "StrongPassword123!", "Machine")
[Environment]::SetEnvironmentVariable("JWT_SECRET_KEY", "YourVeryLongSecretKeyHere123456789012345678901234567890", "Machine")

# 애플리케이션 배포
dotnet publish -c Release -o ./publish
dotnet ./publish/AuthSystem.dll
```

### **Docker 배포 예시**
```dockerfile
# Dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY ./publish .
ENTRYPOINT ["dotnet", "AuthSystem.dll"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  authsystem:
    build: .
    environment:
      - ADMIN_EMAIL=${ADMIN_EMAIL}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
      - DB_CONNECTION_STRING=${DB_CONNECTION_STRING}
    ports:
      - "5000:5000"
```

---

## 🔍 **보안 점검 도구**

### **1. 정적 분석 도구**
- SonarQube
- Security Code Scan
- OWASP Dependency Check

### **2. 런타임 보안 모니터링**
- Application Insights
- Azure Security Center
- AWS GuardDuty

### **3. 취약점 스캔**
- OWASP ZAP
- Burp Suite
- Nmap

---

**⚠️ 중요**: 이 가이드를 따라 배포환경을 설정하기 전에 반드시 테스트 환경에서 먼저 검증하세요! 