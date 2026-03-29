# Seed data via REST API
$baseUrl = "http://localhost:5001/api"

# 1. Register a Chu_Tro user (ignore error if already exists)
Write-Host "=== Registering Chu_Tro user ===" -ForegroundColor Cyan
try {
    $regBody = @{
        hoVaTen = "Chu Tro Demo"
        tenDangNhap = "chutro"
        matKhau = "chutro123"
        sdt = "0901234567"
        cccd = "012345678901"
        vaiTro = "Chu_Tro"
    } | ConvertTo-Json
    $reg = Invoke-RestMethod -Method Post -Uri "$baseUrl/auth/register" -ContentType "application/json" -Body $regBody
    Write-Host "Registered: $($reg.user.tenDangNhap)" -ForegroundColor Green
} catch {
    Write-Host "User may already exist, skipping..." -ForegroundColor Yellow
}

# 2. Login as Chu_Tro
Write-Host "=== Logging in as chutro ===" -ForegroundColor Cyan
$loginBody = @{ tenDangNhap = "chutro"; matKhau = "chutro123" } | ConvertTo-Json
$login = Invoke-RestMethod -Method Post -Uri "$baseUrl/auth/login" -ContentType "application/json" -Body $loginBody
$token = $login.accessToken
$headers = @{ Authorization = "Bearer $token" }
Write-Host "Login OK, token obtained" -ForegroundColor Green

# 3. Seed DayPhong
Write-Host "=== Seeding DayPhong ===" -ForegroundColor Cyan
$existingDP = Invoke-RestMethod -Method Get -Uri "$baseUrl/dayphong" -Headers $headers
if ($existingDP.Count -gt 0) {
    Write-Host "DayPhong already has $($existingDP.Count) records, skipping" -ForegroundColor Yellow
    $dayPhongs = $existingDP
} else {
    $dpData = @(
        @{ soDay = "A"; tang = 0; viTri = "Tang tret - Day A"; dienTich = 20 },
        @{ soDay = "B"; tang = 0; viTri = "Tang tret - Day B"; dienTich = 25 },
        @{ soDay = "A"; tang = 1; viTri = "Tang 1 - Day A"; dienTich = 22 },
        @{ soDay = "B"; tang = 1; viTri = "Tang 1 - Day B"; dienTich = 30 }
    )
    $dayPhongs = @()
    foreach ($dp in $dpData) {
        $body = $dp | ConvertTo-Json
        $result = Invoke-RestMethod -Method Post -Uri "$baseUrl/dayphong" -ContentType "application/json" -Body $body -Headers $headers
        $dayPhongs += $result
        Write-Host "  Added Day $($result.soDay)" -ForegroundColor Green
    }
}

# 4. Seed VatTu
Write-Host "=== Seeding VatTu ===" -ForegroundColor Cyan
$existingVT = Invoke-RestMethod -Method Get -Uri "$baseUrl/vattu" -Headers $headers
if ($existingVT.Count -gt 0) {
    Write-Host "VatTu already has $($existingVT.Count) records, skipping" -ForegroundColor Yellow
    $vatTus = $existingVT
} else {
    $vtData = @(
        @{ tenVatTu = "May lanh"; donGia = 3500000 },
        @{ tenVatTu = "Tu lanh"; donGia = 2000000 },
        @{ tenVatTu = "May giat"; donGia = 4000000 },
        @{ tenVatTu = "Binh nong lanh"; donGia = 1500000 },
        @{ tenVatTu = "Giuong"; donGia = 800000 },
        @{ tenVatTu = "Tu quan ao"; donGia = 600000 },
        @{ tenVatTu = "Ban hoc"; donGia = 400000 },
        @{ tenVatTu = "Quat tran"; donGia = 350000 }
    )
    $vatTus = @()
    foreach ($vt in $vtData) {
        $body = $vt | ConvertTo-Json
        $result = Invoke-RestMethod -Method Post -Uri "$baseUrl/vattu" -ContentType "application/json" -Body $body -Headers $headers
        $vatTus += $result
        Write-Host "  Added $($result.tenVatTu)" -ForegroundColor Green
    }
}

# 5. Seed Phong
Write-Host "=== Seeding Phong ===" -ForegroundColor Cyan
$existingP = Invoke-RestMethod -Method Get -Uri "$baseUrl/phong" -Headers $headers
if ($existingP.Count -gt 0) {
    Write-Host "Phong already has $($existingP.Count) records, skipping" -ForegroundColor Yellow
} else {
    $rooms = @(
        @{ idPhong="P101"; tenPhong="Phong 101"; idDayPhong=$dayPhongs[0]._id; giaPhong=2500000; dienTich=20; loaiPhong="Khong_Gac"; trangThai="Trong"; hinhAnh="/Phong01.jpg"; moTa="Phong don thoang mat"; vatTu=@($vatTus[0]._id, $vatTus[4]._id, $vatTus[7]._id) },
        @{ idPhong="P102"; tenPhong="Phong 102"; idDayPhong=$dayPhongs[0]._id; giaPhong=3000000; dienTich=25; loaiPhong="Khong_Gac"; trangThai="Da_Thue"; hinhAnh="/Phong02.jpg"; moTa="Phong don co ban cong"; vatTu=@($vatTus[0]._id, $vatTus[1]._id, $vatTus[4]._id, $vatTus[6]._id) },
        @{ idPhong="P103"; tenPhong="Phong 103"; idDayPhong=$dayPhongs[0]._id; giaPhong=3500000; dienTich=30; loaiPhong="Co_Gac"; trangThai="Trong"; hinhAnh="/Phong03.jpg"; moTa="Phong doi rong rai"; vatTu=@($vatTus[0]._id, $vatTus[1]._id, $vatTus[3]._id, $vatTus[4]._id, $vatTus[5]._id) },
        @{ idPhong="P201"; tenPhong="Phong 201"; idDayPhong=$dayPhongs[1]._id; giaPhong=2800000; dienTich=22; loaiPhong="Khong_Gac"; trangThai="Da_Thue"; hinhAnh="/Phong04.jpg"; moTa="Phong don yen tinh"; vatTu=@($vatTus[3]._id, $vatTus[4]._id, $vatTus[6]._id, $vatTus[7]._id) },
        @{ idPhong="P202"; tenPhong="Phong 202"; idDayPhong=$dayPhongs[1]._id; giaPhong=4000000; dienTich=35; loaiPhong="Co_Gac"; trangThai="Trong"; hinhAnh="/Phong05.jpg"; moTa="Phong ghep cho nhom ban"; vatTu=@($vatTus[0]._id, $vatTus[2]._id, $vatTus[4]._id, $vatTus[5]._id, $vatTus[7]._id) },
        @{ idPhong="P203"; tenPhong="Phong 203"; idDayPhong=$dayPhongs[1]._id; giaPhong=2200000; dienTich=18; loaiPhong="Khong_Gac"; trangThai="Trong"; hinhAnh="/Phong06.jpg"; moTa="Phong don nho gọn gia re"; vatTu=@($vatTus[4]._id, $vatTus[7]._id) },
        @{ idPhong="P301"; tenPhong="Phong 301"; idDayPhong=$dayPhongs[2]._id; giaPhong=5000000; dienTich=40; loaiPhong="Co_Gac"; trangThai="Da_Thue"; hinhAnh="/Phong07.jpg"; moTa="Phong VIP noi that cao cap"; vatTu=@($vatTus[0]._id, $vatTus[1]._id, $vatTus[2]._id, $vatTus[3]._id, $vatTus[4]._id, $vatTus[5]._id, $vatTus[6]._id) },
        @{ idPhong="P302"; tenPhong="Phong 302"; idDayPhong=$dayPhongs[2]._id; giaPhong=3200000; dienTich=28; loaiPhong="Co_Gac"; trangThai="Trong"; hinhAnh="/Phong08.jpg"; moTa="Phong doi tang 1"; vatTu=@($vatTus[0]._id, $vatTus[3]._id, $vatTus[4]._id, $vatTus[5]._id) },
        @{ idPhong="P401"; tenPhong="Phong 401"; idDayPhong=$dayPhongs[3]._id; giaPhong=3800000; dienTich=32; loaiPhong="Co_Gac"; trangThai="Da_Thue"; hinhAnh="/Phong10.jpg"; moTa="Phong ghep 3 nguoi co bep"; vatTu=@($vatTus[0]._id, $vatTus[1]._id, $vatTus[2]._id, $vatTus[4]._id, $vatTus[7]._id) },
        @{ idPhong="P402"; tenPhong="Phong 402"; idDayPhong=$dayPhongs[3]._id; giaPhong=5500000; dienTich=45; loaiPhong="Co_Gac"; trangThai="Trong"; hinhAnh="/Phong11.jpg"; moTa="Phong VIP rong nhat ban cong lon"; vatTu=@($vatTus[0]._id, $vatTus[1]._id, $vatTus[2]._id, $vatTus[3]._id, $vatTus[4]._id, $vatTus[5]._id, $vatTus[6]._id, $vatTus[7]._id) },
        @{ idPhong="P303"; tenPhong="Phong 303"; idDayPhong=$dayPhongs[2]._id; giaPhong=2600000; dienTich=20; loaiPhong="Khong_Gac"; trangThai="Trong"; hinhAnh="/Phong12.jpg"; moTa="Phong don sang sua"; vatTu=@($vatTus[0]._id, $vatTus[4]._id, $vatTus[6]._id) },
        @{ idPhong="P403"; tenPhong="Phong 403"; idDayPhong=$dayPhongs[3]._id; giaPhong=3400000; dienTich=28; loaiPhong="Co_Gac"; trangThai="Da_Thue"; hinhAnh="/Phong13.jpg"; moTa="Phong doi am cung"; vatTu=@($vatTus[0]._id, $vatTus[1]._id, $vatTus[3]._id, $vatTus[4]._id) }
    )

    foreach ($room in $rooms) {
        $body = $room | ConvertTo-Json -Depth 3
        try {
            $result = Invoke-RestMethod -Method Post -Uri "$baseUrl/phong" -ContentType "application/json" -Body $body -Headers $headers
            Write-Host "  Added $($result.tenPhong)" -ForegroundColor Green
        } catch {
            Write-Host "  Error adding $($room.tenPhong): $_" -ForegroundColor Red
        }
    }
}

Write-Host "`n=== DONE! Seed completed ===" -ForegroundColor Green
