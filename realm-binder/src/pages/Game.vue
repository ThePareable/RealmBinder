<template>
  <div class="game-container">
    <!-- Header -->
    <header class="game-header">
      <div class="header-left">
        <!-- Dropdown Menu -->
        <div class="dropdown-container">
          <button class="dropdown-toggle" @click="toggleDropdown">
            <span class="user-avatar">👤</span>
            <span class="user-name">{{ user?.user_metadata?.display_name || user?.email || 'Kullanıcı' }}</span>
            <span class="dropdown-arrow">{{ showDropdown ? '▲' : '▼' }}</span>
          </button>

          <div v-if="showDropdown" class="dropdown-menu">
            <div class="dropdown-item" @click="goToHome">
              <span class="dropdown-icon">🏠</span>
              Ana Sayfa
            </div>
            <div class="dropdown-item" @click="goToMyGames">
              <span class="dropdown-icon">🎲</span>
              Oyunlarım
            </div>
            <div class="dropdown-divider"></div>
            <div class="dropdown-item logout" @click="handleLogout">
              <span class="dropdown-icon">🚪</span>
              Çıkış Yap
            </div>
          </div>
        </div>

        <div class="game-info">
          <h1>{{ game?.name || 'Yükleniyor...' }}</h1>
          <p v-if="game">{{ game.description }}</p>
        </div>

        <!-- Invite Button -->
        <div class="game-actions">
          <button @click="goToInvite" class="invite-btn">
            <span class="invite-icon">📧</span>
            Davet Et
          </button>
        </div>
      </div>
    </header>

    <div class="game-content">
      <!-- Sidebar -->
      <aside class="game-sidebar" @contextmenu.prevent="handleContextMenu">
        <div class="sidebar-header">
          <h3>Wiki</h3>
          <v-btn @click="toggleAddMenu" size="small" variant="text">
            +
          </v-btn>
        </div>

        <!-- Filter Input -->
        <div class="sidebar-filter">
          <v-text-field v-model="filterText" placeholder="Etiketlere göre filtrele..." density="compact" hide-details
            variant="outlined" size="small"></v-text-field>
        </div>

        <!-- Add Menu -->
        <div v-if="showAddMenu" class="add-menu">
          <div class="menu-item" @click="createNewPage">
            📄 Yeni Sayfa
          </div>
          <div class="menu-item" @click="createNewFolder">
            📁 Yeni Klasör
          </div>
        </div>

        <!-- Context Menu -->
        <div v-if="showContextMenu" class="context-menu" :style="menuPosition">
          <div class="menu-item" @click="createNewPage">
            📄 Yeni Sayfa
          </div>
          <div class="menu-item" @click="createNewFolder">
            📁 Yeni Klasör
          </div>
        </div>

        <!-- Inline Input for New Item -->
        <div v-if="showInlineInput" class="inline-input">
          <v-text-field v-model="newItemName" placeholder="İsim girin..." @keyup.enter="saveNewItem"
            @keyup.esc="cancelNewItem" ref="inlineInputRef" density="compact" hide-details variant="outlined"
            size="small" autofocus></v-text-field>
        </div>

        <!-- Wiki Tree -->
        <div class="wiki-tree">
          <div class="tree-item templates">
            <div class="tree-header" @click="toggleTemplates">
              <span>{{ templatesExpanded ? '▼' : '▶' }}</span>
              <span>Templates</span>
            </div>
            <div v-if="templatesExpanded" class="tree-children">
              <div class="tree-item">
                <span>Default Templates</span>
              </div>
            </div>
          </div>

          <!-- Dynamic Wiki Pages -->
          <div v-for="page in filteredWikiPages" :key="page.id" class="tree-item page-item"
            :class="{ active: selectedPage?.id === page.id }" @click="selectPage(page)">
            📄 <span>{{ page.title }}</span>
          </div>
        </div>

        <!-- Search Input -->
        <div class="sidebar-search">
          <v-text-field v-model="searchText" placeholder="Ara..." density="compact" hide-details variant="outlined"
            size="small"></v-text-field>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="game-main">
        <!-- Map View -->
        <div v-if="!selectedPage" class="map-container">
          <div class="map-placeholder">
            <div style="font-size: 64px; color: grey;">🗺️</div>
            <h3>Harita Alanı</h3>
            <p>Burada harita görünecek</p>
          </div>
        </div>

        <!-- Wiki Page View -->
        <div v-else class="wiki-page-container">
          <div class="wiki-header">
            <h2>{{ selectedPage.title }}</h2>
            <div class="wiki-actions">
              <v-btn @click="editPage" variant="outlined" size="small">
                Düzenle
              </v-btn>
              <v-btn @click="closePage" variant="text" size="small">
                ✕
              </v-btn>
            </div>
          </div>

          <div class="wiki-content">
            <div v-if="!isEditing" class="wiki-display">
              <p>{{ selectedPage.content || 'Bu sayfa henüz boş.' }}</p>
            </div>

            <div v-else class="wiki-editor">
              <v-textarea v-model="editingContent" placeholder="Sayfa içeriğini yazın..." rows="10"
                variant="outlined"></v-textarea>
              <div class="editor-actions">
                <v-btn @click="savePage" color="primary" size="small">
                  Kaydet
                </v-btn>
                <v-btn @click="cancelEdit" variant="text" size="small">
                  İptal
                </v-btn>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { supabase } from '../utils/supabase'

const route = useRoute()
const router = useRouter()
const { user, signOut } = useAuth()

// Game data
const game = ref(null)
const isGM = ref(false)

// Sidebar state
const showAddMenu = ref(false)
const showContextMenu = ref(false)
const showInlineInput = ref(false)
const newItemName = ref('')
const newItemType = ref('') // 'page' or 'folder'
const menuPosition = ref({ top: '0px', left: '0px' })
const templatesExpanded = ref(false)
const filterText = ref('')
const searchText = ref('')
const inlineInputRef = ref(null)

// Dropdown state
const showDropdown = ref(false)

// Wiki pages
const wikiPages = ref([])
const selectedPage = ref(null)
const isEditing = ref(false)
const editingContent = ref('')

// Computed filtered pages
const filteredWikiPages = computed(() => {
  if (!filterText.value) return wikiPages.value
  return wikiPages.value.filter(page =>
    page.title.toLowerCase().includes(filterText.value.toLowerCase())
  )
})

// Load game data
const loadGame = async () => {
  try {
    const { data: gameData, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('id', route.params.id)
      .single()

    if (gameError) throw gameError
    game.value = gameData

    // Check if user is GM
    const { data: userRole, error: roleError } = await supabase
      .from('game_users')
      .select('role')
      .eq('game_id', route.params.id)
      .eq('user_id', user.value.id)
      .single()

    if (roleError) throw roleError
    isGM.value = userRole.role === 'gm'

    // Load wiki pages
    await loadWikiPages()
  } catch (error) {
    console.error('Oyun yüklenirken hata:', error)
  }
}

// Load wiki pages
const loadWikiPages = async () => {
  try {
    const { data, error } = await supabase
      .from('wiki_pages')
      .select('*')
      .eq('game_id', route.params.id)
      .order('created_at', { ascending: true })

    if (error) throw error
    wikiPages.value = data || []
  } catch (error) {
    console.error('Wiki sayfaları yüklenirken hata:', error)
  }
}

// Toggle add menu
const toggleAddMenu = () => {
  console.log('Toggle add menu clicked, isGM:', isGM.value)
  // Temporarily allow all users to add pages for testing
  showAddMenu.value = !showAddMenu.value
  console.log('Add menu toggled:', showAddMenu.value)
}

// Show context menu
const handleContextMenu = (event) => {
  console.log('Context menu triggered, isGM:', isGM.value)
  // Temporarily allow all users to use context menu for testing

  event.preventDefault()
  event.stopPropagation()

  menuPosition.value = {
    top: event.clientY + 'px',
    left: event.clientX + 'px'
  }
  showContextMenu.value = true
  console.log('Context menu shown')
}

// Close context menu when clicking outside
const closeContextMenu = () => {
  showContextMenu.value = false
}

// Close add menu when clicking outside
const closeAddMenu = () => {
  showAddMenu.value = false
}

// Create new page
const createNewPage = () => {
  showAddMenu.value = false
  showContextMenu.value = false
  newItemType.value = 'page'
  showInlineInput.value = true
  newItemName.value = '' // Reset the input
  nextTick(() => {
    if (inlineInputRef.value) {
      inlineInputRef.value.focus()
    }
  })
}

// Create new folder
const createNewFolder = () => {
  showAddMenu.value = false
  showContextMenu.value = false
  newItemType.value = 'folder'
  showInlineInput.value = true
  newItemName.value = '' // Reset the input
  nextTick(() => {
    if (inlineInputRef.value) {
      inlineInputRef.value.focus()
    }
  })
}

// Save new item
const saveNewItem = async () => {
  if (!newItemName.value.trim()) return

  try {
    if (newItemType.value === 'page') {
      const { data, error } = await supabase
        .from('wiki_pages')
        .insert({
          game_id: route.params.id,
          title: newItemName.value,
          content: '',
          parent_id: null
        })
        .select()
        .single()

      if (error) throw error
      wikiPages.value.push(data)
    }
    // TODO: Implement folder creation when needed
  } catch (error) {
    console.error('Yeni öğe oluşturulurken hata:', error)
  } finally {
    cancelNewItem()
  }
}

// Cancel new item creation
const cancelNewItem = () => {
  showInlineInput.value = false
  newItemName.value = ''
  newItemType.value = ''
}

// Select page
const selectPage = (page) => {
  selectedPage.value = page
}

// Close page
const closePage = () => {
  selectedPage.value = null
  isEditing.value = false
}

// Edit page
const editPage = () => {
  if (!isGM.value) return
  editingContent.value = selectedPage.value.content || ''
  isEditing.value = true
}

// Save page
const savePage = async () => {
  try {
    const { error } = await supabase
      .from('wiki_pages')
      .update({ content: editingContent.value })
      .eq('id', selectedPage.value.id)

    if (error) throw error

    selectedPage.value.content = editingContent.value
    isEditing.value = false
  } catch (error) {
    console.error('Sayfa kaydedilirken hata:', error)
  }
}

// Cancel edit
const cancelEdit = () => {
  isEditing.value = false
}

// Toggle templates
const toggleTemplates = () => {
  templatesExpanded.value = !templatesExpanded.value
}

// Dropdown functions
const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

const goToHome = () => {
  showDropdown.value = false
  router.push('/')
}

const goToMyGames = () => {
  showDropdown.value = false
  router.push('/my-games')
}

const goToInvite = () => {
  router.push(`/game/${route.params.id}/invite`)
}

const handleLogout = async () => {
  showDropdown.value = false
  await signOut()
  router.push('/')
}

// Close menus when clicking outside
onMounted(() => {
  loadGame()
  document.addEventListener('click', (event) => {
    // Close dropdown if clicking outside
    const dropdown = document.querySelector('.dropdown-container')
    if (dropdown && !dropdown.contains(event.target)) {
      showDropdown.value = false
    }

    closeAddMenu()
    closeContextMenu()
  })
})
</script>

<style scoped>
.game-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 50%, #2A2A2A 100%);
  color: #ffffff;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.game-header {
  background: rgba(45, 45, 45, 0.8);
  backdrop-filter: blur(8px);
  padding: 0.75rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(218, 165, 32, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
}

.game-actions {
  display: flex;
  gap: 12px;
}

.invite-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(45deg, #8B4513, #DAA520);
  color: #FFFFFF;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(218, 165, 32, 0.2);
}

.invite-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(218, 165, 32, 0.3);
  background: linear-gradient(45deg, #A0522D, #FFD700);
}

.invite-icon {
  font-size: 1rem;
}

.game-info h1 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #DAA520;
  letter-spacing: 0.3px;
}

.game-info p {
  margin: 0.25rem 0 0 0;
  color: #B0BEC5;
  font-size: 0.8rem;
  font-weight: 400;
  line-height: 1.3;
}

/* Dropdown Styles */
.dropdown-container {
  position: relative;
  z-index: 10001;
}

.dropdown-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(218, 165, 32, 0.2);
  border-radius: 8px;
  padding: 8px 12px;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.85rem;
  font-weight: 500;
  backdrop-filter: blur(6px);
}

.dropdown-toggle:hover {
  background: rgba(218, 165, 32, 0.1);
  border-color: rgba(218, 165, 32, 0.4);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(218, 165, 32, 0.15);
}

.user-avatar {
  font-size: 1.1rem;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
}

.user-name {
  font-weight: 500;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #E0E0E0;
  font-size: 0.8rem;
}

.dropdown-arrow {
  font-size: 0.8rem;
  transition: transform 0.3s ease;
  color: #DAA520;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  background: rgba(45, 45, 45, 0.95);
  backdrop-filter: blur(12px);
  border: 2px solid rgba(218, 165, 32, 0.3);
  border-radius: 12px;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.5);
  min-width: 200px;
  z-index: 10000;
  margin-top: 8px;
  overflow: hidden;
  padding: 8px 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  color: #E0E0E0;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
  font-weight: 500;
  border-radius: 8px;
  margin: 2px 8px;
}

.dropdown-item:hover {
  background: rgba(218, 165, 32, 0.1);
  color: #DAA520;
  transform: translateX(4px);
}

.dropdown-item.logout:hover {
  background: rgba(211, 47, 47, 0.1);
  color: #FF6B6B;
}

.dropdown-icon {
  font-size: 1.1rem;
  width: 18px;
  text-align: center;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
}

.dropdown-divider {
  height: 1px;
  background: rgba(218, 165, 32, 0.2);
  margin: 8px 12px;
  border-radius: 1px;
}

.game-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.game-sidebar {
  width: 280px;
  background: rgba(45, 45, 45, 0.9);
  backdrop-filter: blur(8px);
  border-right: 1px solid rgba(218, 165, 32, 0.2);
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
}

.sidebar-header {
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(218, 165, 32, 0.15);
  background: rgba(218, 165, 32, 0.03);
}

.sidebar-header h3 {
  margin: 0;
  color: #DAA520;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.sidebar-filter {
  padding: 1rem;
  border-bottom: 1px solid rgba(218, 165, 32, 0.08);
  background: rgba(255, 255, 255, 0.01);
}

.sidebar-search {
  padding: 1rem;
  border-top: 1px solid rgba(218, 165, 32, 0.08);
  margin-top: auto;
  background: rgba(255, 255, 255, 0.01);
}

.wiki-tree {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.005);
}

.tree-item {
  margin-bottom: 0.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.3s ease;
  border: 1px solid transparent;
  font-size: 0.9rem;
}

.tree-item:hover {
  background: rgba(218, 165, 32, 0.08);
  border-color: rgba(218, 165, 32, 0.2);
  transform: translateX(2px);
}

.tree-item.active {
  background: rgba(218, 165, 32, 0.12);
  border-color: rgba(218, 165, 32, 0.3);
  box-shadow: 0 1px 4px rgba(218, 165, 32, 0.15);
}

.tree-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: #E0E0E0;
  font-size: 0.85rem;
}

.tree-children {
  margin-left: 1.5rem;
  margin-top: 0.5rem;
  padding-left: 0.75rem;
  border-left: 1px solid rgba(218, 165, 32, 0.15);
}

.page-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #B0BEC5;
  font-weight: 400;
  font-size: 0.8rem;
}

.add-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: rgba(45, 45, 45, 0.95);
  backdrop-filter: blur(12px);
  border: 2px solid rgba(218, 165, 32, 0.3);
  border-radius: 12px;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.5);
  z-index: 9999;
  min-width: 180px;
  padding: 8px 0;
  margin-top: 8px;
}

.context-menu {
  position: fixed;
  background: rgba(45, 45, 45, 0.95);
  backdrop-filter: blur(12px);
  border: 2px solid rgba(218, 165, 32, 0.3);
  border-radius: 12px;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.5);
  z-index: 9999;
  min-width: 180px;
  padding: 8px 0;
}

.menu-item {
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #E0E0E0;
  font-weight: 500;
  border-radius: 8px;
  margin: 2px 8px;
}

.menu-item:hover {
  background: rgba(218, 165, 32, 0.1);
  color: #DAA520;
  transform: translateX(4px);
}

.inline-input {
  padding: 1.5rem;
  border-bottom: 1px solid rgba(218, 165, 32, 0.1);
  background: rgba(255, 255, 255, 0.02);
}

.game-main {
  flex: 1;
  background: rgba(26, 26, 26, 0.95);
  backdrop-filter: blur(8px);
  overflow: hidden;
}

.map-container {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.map-placeholder {
  text-align: center;
  color: #b0b0b0;
}

.map-placeholder h3 {
  margin: 1rem 0 0.5rem 0;
  color: #ffffff;
}

.wiki-page-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.wiki-header {
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid rgba(218, 165, 32, 0.3);
  background: rgba(45, 45, 45, 0.95);
  backdrop-filter: blur(12px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.wiki-header h2 {
  margin: 0;
  color: #DAA520;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.wiki-actions {
  display: flex;
  gap: 12px;
}

.wiki-content {
  flex: 1;
  padding: 2.5rem;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.01);
}

.wiki-display {
  color: #E0E0E0;
  line-height: 1.8;
  font-size: 1.05rem;
}

.wiki-editor {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.editor-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 1rem 0;
}

.templates {
  font-weight: 600;
  color: #DAA520;
  font-size: 0.9rem;
}
</style>