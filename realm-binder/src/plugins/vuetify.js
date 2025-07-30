import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

export default createVuetify({
    theme: {
        defaultTheme: 'dark',
        themes: {
            dark: {
                colors: {
                    // Ana renkler - DnD teması
                    primary: '#8B4513', // Kahverengi - ahşap/deri teması
                    secondary: '#2C1810', // Koyu kahverengi
                    accent: '#DAA520', // Altın sarısı - hazine teması
                    error: '#DC143C', // Kırmızı - tehlike
                    info: '#4169E1', // Mavi - bilgi
                    success: '#228B22', // Yeşil - başarı
                    warning: '#FF8C00', // Turuncu - uyarı

                    // Özel renkler
                    'dnd-gold': '#FFD700', // Parlak altın
                    'dnd-silver': '#C0C0C0', // Gümüş
                    'dnd-bronze': '#CD7F32', // Bronz
                    'dnd-purple': '#800080', // Mor - büyü
                    'dnd-red': '#8B0000', // Koyu kırmızı - kan
                    'dnd-green': '#006400', // Koyu yeşil - orman
                    'dnd-blue': '#000080', // Koyu mavi - deniz

                    // Arka plan renkleri
                    background: '#0A0A0A', // Çok koyu arka plan
                    surface: '#1A1A1A', // Koyu yüzey
                    'surface-variant': '#2A2A2A', // Biraz daha açık yüzey

                    // Metin renkleri
                    'on-primary': '#FFFFFF',
                    'on-secondary': '#FFFFFF',
                    'on-surface': '#E0E0E0',
                    'on-background': '#F5F5F5',
                },
                dark: true,
            },
        },
    },
    icons: {
        defaultSet: 'mdi',
        aliases,
        sets: { mdi },
    },
    defaults: {
        VCard: {
            rounded: 'lg',
            elevation: 8,
        },
        VBtn: {
            rounded: 'lg',
            elevation: 2,
        },
        VTextField: {
            variant: 'outlined',
            rounded: 'lg',
        },
    },
})