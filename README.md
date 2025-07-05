# Mail Server Configuration - mail.yusufstar.com

Bu dokümantasyon `mail.yusufstar.com` mail sunucusunun otomatik konfigürasyon ayarlarını içerir. Bu bilgiler mailcow mail server tarafından sağlanmaktadır.

## 📧 Mail Sunucu Bilgileri

- **Sunucu Adı**: mail.yusufstar.com
- **Sunucu Türü**: mailcow mail server
- **Webmail Adresi**: https://mail.yusufstar.com/SOGo/
- **Admin Panel**: https://mail.yusufstar.com/admin

## 📥 Gelen Mail Sunucu Ayarları (IMAP)

### SSL/TLS ile IMAP (Önerilen)
```
Sunucu: mail.yusufstar.com
Port: 993
Güvenlik: SSL/TLS
Kullanıcı Adı: example@yusufstar.com
Kimlik Doğrulama: Şifre (cleartext)
```

### STARTTLS ile IMAP
```
Sunucu: mail.yusufstar.com
Port: 143
Güvenlik: STARTTLS
Kullanıcı Adı: example@yusufstar.com
Kimlik Doğrulama: Şifre (cleartext)
```

## 📥 Gelen Mail Sunucu Ayarları (POP3)

### SSL/TLS ile POP3
```
Sunucu: mail.yusufstar.com
Port: 995
Güvenlik: SSL/TLS
Kullanıcı Adı: example@yusufstar.com
Kimlik Doğrulama: Şifre (cleartext)
```

### STARTTLS ile POP3
```
Sunucu: mail.yusufstar.com
Port: 110
Güvenlik: STARTTLS
Kullanıcı Adı: example@yusufstar.com
Kimlik Doğrulama: Şifre (cleartext)
```

## 📤 Giden Mail Sunucu Ayarları (SMTP)

### SSL/TLS ile SMTP (Önerilen)
```
Sunucu: mail.yusufstar.com
Port: 465
Güvenlik: SSL/TLS
Kullanıcı Adı: example@yusufstar.com
Kimlik Doğrulama: Şifre (cleartext)
```

### STARTTLS ile SMTP
```
Sunucu: mail.yusufstar.com
Port: 587
Güvenlik: STARTTLS
Kullanıcı Adı: example@yusufstar.com
Kimlik Doğrulama: Şifre (cleartext)
```

## 🔧 Mail Client Konfigürasyonu

### Thunderbird
1. Yeni hesap ekle
2. Email adresinizi girin
3. Thunderbird otomatik olarak bu ayarları bulacaktır
4. Şifrenizi girin ve kurulumu tamamlayın

### Outlook
1. Dosya > Hesap Ekle
2. Email adresinizi girin
3. Gelişmiş seçenekleri kullanarak yukarıdaki ayarları manuel olarak girin

### Apple Mail (macOS/iOS)
1. Mail > Hesap Ekle > Diğer Mail Hesabı
2. Yukarıdaki IMAP/SMTP ayarlarını kullanın

### Android/iOS Mail Apps
Çoğu modern mail uygulaması otomatik konfigürasyonu destekler. Email adresinizi girdiğinizde ayarlar otomatik olarak bulunacaktır.

## 🌐 Webmail Erişimi

Tarayıcınızdan mail hesabınıza erişmek için:
```
https://mail.yusufstar.com/SOGo/
```

## 🔐 Güvenlik Notları

⚠️ **Önemli Güvenlik Uyarısı**: 
- Eğer yönetici tarafından verilen şifreyi henüz değiştirmediyseniz, lütfen şimdi değiştirin
- Eski şifreniz varsa, güvenlik nedeniyle yeni bir şifre belirleyin
- Admin panelinden şifre değişikliği yapabilirsiniz: https://mail.yusufstar.com/admin

## 📋 Otomatik Konfigürasyon

Bu mail sunucusu Mozilla Autoconfig protokolünü destekler. Thunderbird gibi mail clientları otomatik olarak bu ayarları bulabilir.

Autoconfig URL'i:
```
https://mail.yusufstar.com/.well-known/autoconfig/mail/config-v1.1.xml
```

## 🛠️ Sorun Giderme

### Bağlantı Sorunları
1. Sunucu adresinin doğru olduğundan emin olun: `mail.yusufstar.com`
2. Port numaralarını kontrol edin
3. SSL/TLS ayarlarının doğru olduğundan emin olun

### Kimlik Doğrulama Sorunları
1. Email adresinizin tam olarak girildiğinden emin olun
2. Şifrenizin doğru olduğundan emin olun
3. Gerekirse admin panelinden şifrenizi sıfırlayın

### Destek
Teknik destek için mail sunucusu yöneticinizle iletişime geçin.

---

**Son Güncelleme**: 2024
**Mail Sunucu Versiyonu**: mailcow
**Konfigürasyon Versiyonu**: 1.1 