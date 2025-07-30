import { ref, onMounted } from 'vue'
import { supabase } from '../utils/supabase'

export function useAuth() {
  const user = ref(null)
  const loading = ref(true)

  const checkUser = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      user.value = currentUser
    } catch (error) {
      console.error('Kullanıcı kontrolü hatası:', error)
    } finally {
      loading.value = false
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Çıkış hatası:', error)
      } else {
        user.value = null
      }
    } catch (error) {
      console.error('Çıkış hatası:', error)
    }
  }

  // Kullanıcı adı veya e-posta ile giriş yapma
  const signInWithUsernameOrEmail = async (usernameOrEmail, password) => {
    try {
      console.log('Giriş denemesi:', usernameOrEmail)

      // E-posta formatında mı kontrol et
      const isEmail = usernameOrEmail.includes('@')
      console.log('E-posta formatında mı:', isEmail)

      let loginEmail = usernameOrEmail

      if (!isEmail) {
        console.log('Kullanıcı adı ile giriş deneniyor...')

        // Kullanıcı adı ise, mapping tablosundan e-posta bul
        const { data: mapping, error: mappingError } = await supabase
          .from('user_login_mapping')
          .select('email')
          .eq('username', usernameOrEmail)
          .single()

        console.log('Mapping sonucu:', mapping, mappingError)

        if (mappingError || !mapping) {
          console.log('Mapping bulunamadı, fallback yöntemi deneniyor...')
          // Mapping bulunamadıysa, eski yöntemi dene
          loginEmail = usernameOrEmail + '@realmbinder.local'
        } else {
          console.log('Mapping bulundu, e-posta:', mapping.email)
          loginEmail = mapping.email
        }
      }

      console.log('Giriş yapılacak e-posta:', loginEmail)

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: password
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Giriş hatası:', error)
      return { data: null, error }
    }
  }

  // Kullanıcı kaydı sırasında mapping oluştur
  const createUserMapping = async (userId, username, email) => {
    try {
      console.log('Mapping oluşturuluyor:', { userId, username, email })

      const { error } = await supabase
        .from('user_login_mapping')
        .insert({
          user_id: userId,
          username: username,
          email: email
        })

      if (error) {
        console.error('Mapping oluşturma hatası:', error)
      } else {
        console.log('Mapping başarıyla oluşturuldu')
      }
    } catch (error) {
      console.error('Mapping oluşturma hatası:', error)
    }
  }

  onMounted(() => {
    checkUser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        user.value = session?.user ?? null
        loading.value = false
      }
    )
    return () => subscription.unsubscribe()
  })

  return {
    user,
    loading,
    signOut,
    checkUser,
    signInWithUsernameOrEmail,
    createUserMapping
  }
} 