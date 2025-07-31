<template>
  <div class="game-container">
    <!-- Header -->
    <header class="game-header">
      <div class="header-left">
        <h1>{{ game?.name || 'Yükleniyor...' }}</h1>
        <p v-if="game">{{ game.description }}</p>
      </div>
      <div class="header-right">
        <v-btn @click="signOut" variant="outlined" color="error">
          Çıkış Yap
        </v-btn>
      </div>
    </header>

    <div class="game-content">
      <!-- Sidebar -->
      <aside class="game-sidebar" @contextmenu.prevent="handleContextMenu">
        <div class="sidebar-header">
          <h3>Wiki</h3>
                     <v-btn
             @click="toggleAddMenu"
             size="small"
             variant="text"
           >
             +
           </v-btn>
        </div>

        <!-- Filter Input -->
        <div class="sidebar-filter">
                     <v-text-field
             v-model="filterText"
             placeholder="Etiketlere göre filtrele..."
             density="compact"
             hide-details
             variant="outlined"
             size="small"
           ></v-text-field>
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
          <v-text-field
            v-model="newItemName"
            placeholder="İsim girin..."
            @keyup.enter="saveNewItem"
            @keyup.esc="cancelNewItem"
            ref="inlineInputRef"
            density="compact"
            hide-details
            variant="outlined"
            size="small"
            autofocus
          ></v-text-field>
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
           <div 
             v-for="page in filteredWikiPages" 
             :key="page.id"
             class="tree-item page-item"
             :class="{ active: selectedPage?.id === page.id }"
             @click="selectPage(page)"
           >
             📄 <span>{{ page.title }}</span>
           </div>
        </div>

        <!-- Search Input -->
        <div class="sidebar-search">
                     <v-text-field
             v-model="searchText"
             placeholder="Ara..."
             density="compact"
             hide-details
             variant="outlined"
             size="small"
           ></v-text-field>
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
              <v-textarea
                v-model="editingContent"
                placeholder="Sayfa içeriğini yazın..."
                rows="10"
                variant="outlined"
              ></v-textarea>
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

// Close menus when clicking outside
onMounted(() => {
  loadGame()
  document.addEventListener('click', () => {
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
  background: #1a1a1a;
  color: #ffffff;
}

.game-header {
  background: #2d2d2d;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #404040;
}

.header-left h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #ffffff;
}

.header-left p {
  margin: 0.5rem 0 0 0;
  color: #b0b0b0;
  font-size: 0.9rem;
}

.game-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.game-sidebar {
  width: 300px;
  background: #2d2d2d;
  border-right: 1px solid #404040;
  display: flex;
  flex-direction: column;
  position: relative;
}

.sidebar-header {
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #404040;
}

.sidebar-header h3 {
  margin: 0;
  color: #ffffff;
}

.sidebar-filter {
  padding: 1rem;
  border-bottom: 1px solid #404040;
}

.sidebar-search {
  padding: 1rem;
  border-top: 1px solid #404040;
  margin-top: auto;
}

.wiki-tree {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

.tree-item {
  margin-bottom: 0.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.tree-item:hover {
  background: #404040;
}

.tree-item.active {
  background: #1976d2;
}

.tree-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tree-children {
  margin-left: 1.5rem;
  margin-top: 0.5rem;
}

.page-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.add-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: #2d2d2d;
  border: 1px solid #404040;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 9999;
  min-width: 150px;
}

.context-menu {
  position: fixed;
  background: #2d2d2d;
  border: 1px solid #404040;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 9999;
  min-width: 150px;
}

.menu-item {
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.menu-item:hover {
  background: #404040;
}

.inline-input {
  padding: 1rem;
  border-bottom: 1px solid #404040;
}

.game-main {
  flex: 1;
  background: #1a1a1a;
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
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #404040;
  background: #2d2d2d;
}

.wiki-header h2 {
  margin: 0;
  color: #ffffff;
}

.wiki-actions {
  display: flex;
  gap: 0.5rem;
}

.wiki-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

.wiki-display {
  color: #ffffff;
  line-height: 1.6;
}

.wiki-editor {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.editor-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.templates {
  font-weight: 500;
  color: #ffffff;
}
</style>