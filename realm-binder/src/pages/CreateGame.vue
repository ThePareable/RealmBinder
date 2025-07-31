<template>
  <div class="create-game-page">
    <div class="create-game-container">
      <div class="create-game-card">
        <div class="create-game-header">
          <div class="logo">
            <img src="../assets/logo_white.png" alt="Realm Binder" class="logo-image" />
          </div>
          <h1 class="create-game-title">Yeni Oyun Oluştur</h1>
          <p class="create-game-subtitle">DnD dünyanızı başlatın...</p>
        </div>

        <div class="create-game-form">
          <div class="form-group">
            <label class="form-label">Oyun Adı</label>
            <input v-model="gameName" type="text" class="form-input" placeholder="Oyununuzun adını girin"
              :disabled="loading" />
          </div>

          <div class="form-group">
            <label class="form-label">Açıklama (İsteğe bağlı)</label>
            <textarea v-model="gameDescription" class="form-textarea"
              placeholder="Oyununuz hakkında kısa bir açıklama..." :disabled="loading" rows="3"></textarea>
          </div>

          <button class="create-game-button" @click="handleCreateGame" :disabled="loading || !gameName.trim()">
            {{ loading ? 'Oyun oluşturuluyor...' : 'Oyun Oluştur' }}
          </button>
        </div>

        <div class="create-game-footer">
          <button class="back-button" @click="$router.push('/')">
            Geri Dön
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../utils/supabase'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { user } = useAuth()

const gameName = ref('')
const gameDescription = ref('')
const loading = ref(false)

const handleCreateGame = async () => {
  if (!user.value || !user.value.id) {
    alert('Lütfen önce giriş yapın.')
    router.push('/')
    return
  }

  if (!gameName.value.trim()) {
    alert('Lütfen oyun adını girin.')
    return
  }

  loading.value = true

  try {
    // 1. Oyunu oluştur
    const { data: game, error: gameError } = await supabase
      .from('games')
      .insert({
        name: gameName.value.trim(),
        description: gameDescription.value.trim() || null,
        owner_id: user.value.id
      })
      .select()
      .single()

    if (gameError) {
      throw gameError
    }

    // 2. Oyun sahibini game_users tablosuna ekle (GM rolü ile)
    const { error: userError } = await supabase
      .from('game_users')
      .insert({
        game_id: game.id,
        user_id: user.value.id,
        role: 'gm'
      })

    if (userError) {
      throw userError
    }

    console.log('Oyun başarıyla oluşturuldu:', game)
    alert('Oyun başarıyla oluşturuldu!')

    // Oyun sayfasına yönlendir
    router.push(`/game/${game.id}`)

  } catch (error) {
    console.error('Oyun oluşturma hatası:', error)
    alert('Oyun oluşturulurken bir hata oluştu: ' + error.message)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.create-game-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 50%, #2A2A2A 100%);
  background-image: url('../assets/9jGzye.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  will-change: auto;
}

.create-game-container {
  width: 100%;
  max-width: 500px;
}

.create-game-card {
  background: rgba(26, 26, 26, 0.95);
  backdrop-filter: blur(12px);
  border: 5px solid rgba(218, 165, 32, 0.4);
  border-radius: 2vh;
  padding: 30px 30px 50px 30px;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.6);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  will-change: transform, box-shadow;
}

.create-game-header {
  text-align: center;
  margin-bottom: 24px;
}

.logo {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}

.logo-image {
  height: 18vh;
  width: auto;
  object-fit: contain;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
  transition: all 0.3s ease;
}

.logo-image:hover {
  transform: scale(1.05);
  filter: drop-shadow(0 4px 12px rgba(218, 165, 32, 0.2));
}

.create-game-title {
  font-size: 24px;
  font-weight: 700;
  color: #FFFFFF;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
}

.create-game-subtitle {
  font-size: 14px;
  color: #B0BEC5;
  margin: 0;
}

.create-game-form {
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #E0E0E0;
  margin-bottom: 6px;
}

.form-input {
  width: 100%;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #FFFFFF;
  font-size: 14px;
  transition: border-color 0.2s ease, background-color 0.2s ease;
  box-sizing: border-box;
  will-change: border-color, background-color;
}

.form-input:focus {
  outline: none;
  border-color: #DAA520;
  background: rgba(255, 255, 255, 0.08);
}

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-input::placeholder {
  color: #9E9E9E;
}

.form-textarea {
  width: 100%;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #FFFFFF;
  font-size: 14px;
  transition: border-color 0.2s ease, background-color 0.2s ease;
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
  box-sizing: border-box;
  will-change: border-color, background-color;
}

.form-textarea:focus {
  outline: none;
  border-color: #DAA520;
  background: rgba(255, 255, 255, 0.08);
}

.form-textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-textarea::placeholder {
  color: #9E9E9E;
}

.create-game-button {
  width: 100%;
  padding: 12px 20px;
  background: linear-gradient(45deg, #8B4513, #DAA520);
  border: none;
  border-radius: 8px;
  color: #FFFFFF;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  letter-spacing: 0.5px;
  margin-bottom: 15px;
}

.create-game-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(218, 165, 32, 0.3);
}

.create-game-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.create-game-footer {
  text-align: center;
}

.back-button {
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #B0BEC5;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #FFFFFF;
}

@media (max-width: 480px) {
  .create-game-card {
    padding: 24px;
  }

  .create-game-title {
    font-size: 24px;
  }
}
</style>