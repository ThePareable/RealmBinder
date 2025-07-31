<template>
  <div class="game-container">
    <!-- Header -->
    <header class="game-header">
      <div class="header-left">
        <!-- Dropdown Menu -->
        <div class="dropdown-container">
          <button class="dropdown-toggle" @click="toggleDropdown">
            <span class="user-avatar">👤</span>
            <span class="user-name">{{ user?.user_metadata?.display_name }}</span>
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
      <aside class="game-sidebar" @contextmenu.prevent="handleContextMenu($event, null)">
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
          <div class="menu-item" @click="startCreateFile">
            📄 Yeni Dosya
          </div>
          <div class="menu-item" @click="startCreateFolder">
            📁 Yeni Klasör
          </div>
        </div>

        <!-- Context Menu -->
        <div v-if="showContextMenu" class="context-menu" :style="menuPosition" @click.stop>
          <div class="menu-item" @click="startCreateFile">
            📄 Yeni Dosya
          </div>
          <div class="menu-item" @click="startCreateFolder">
            📁 Yeni Klasör
          </div>
        </div>

        <!-- Wiki Tree -->
        <div class="wiki-tree" @contextmenu.prevent="handleContextMenu($event, null)">
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

          <!-- Dynamic Wiki Items with Drag & Drop -->
          <div v-for="item in wikiTree" :key="item.id" class="tree-item" :class="{
            'active': selectedPage?.id === item.id,
            'dragging': draggedItem?.id === item.id,
            'drag-over': dragOverItem?.id === item.id,
            'folder-item': item.isFolder,
            'file-item': !item.isFolder
          }" draggable="true" @dragstart="handleDragStart($event, item)" @dragover="handleDragOver($event, item)"
            @dragenter="handleDragEnter($event, item)" @dragleave="handleDragLeave($event)"
            @drop="handleDrop($event, item)" @click.stop="handleItemClick(item)"
            @contextmenu="handleContextMenu($event, item)" :style="{ paddingLeft: `${item.level * 20 + 12}px` }">
            <div class="item-content">
              <span class="item-icon">
                {{ item.isFolder ? '📁' : '📄' }}
              </span>
              <span class="item-title">{{ item.title }}</span>
              <span v-if="item.isFolder" class="folder-toggle">
                {{ item.expanded ? '▼' : '▶' }}
              </span>
            </div>

            <!-- Nested items -->
            <div v-if="item.isFolder && item.expanded" class="tree-children">
              <div v-for="child in item.children" :key="child.id" class="tree-item" :class="{
                'active': selectedPage?.id === child.id,
                'dragging': draggedItem?.id === child.id,
                'drag-over': dragOverItem?.id === child.id,
                'folder-item': child.isFolder,
                'file-item': !child.isFolder
              }" draggable="true" @dragstart="handleDragStart($event, child)" @dragover="handleDragOver($event, child)"
                @dragenter="handleDragEnter($event, child)" @dragleave="handleDragLeave($event)"
                @drop="handleDrop($event, child)" @click.stop="handleItemClick(child)"
                @contextmenu="handleContextMenu($event, child)"
                :style="{ paddingLeft: `${(child.level + 1) * 20 + 12}px` }">
                <div class="item-content">
                  <span class="item-icon">
                    {{ child.isFolder ? '📁' : '📄' }}
                  </span>
                  <span class="item-title">{{ child.title }}</span>
                  <span v-if="child.isFolder" class="folder-toggle">
                    {{ child.expanded ? '▼' : '▶' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Inline Input for New Item -->
        <div v-if="showInlineInput" class="inline-input">
          <div class="input-container">
            <input v-model="newItemName" :placeholder="`${newItemType === 'file' ? 'Dosya' : 'Klasör'} adı girin...`"
              @keydown.enter="saveNewItem" @keydown.esc="cancelNewItem" @blur="saveNewItem" ref="inlineInputRef"
              class="inline-input-field" autofocus />
            <div class="input-actions">
              <button @click="saveNewItem" class="save-btn">✓</button>
              <button @click="cancelNewItem" class="cancel-btn">✕</button>
            </div>
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

        <!-- Wiki File View -->
        <div v-else class="wiki-page-container">
          <div class="wiki-header">
            <h2>{{ selectedPage.title }}</h2>
            <div class="wiki-actions">
              <v-btn @click="editFile" variant="outlined" size="small">
                Düzenle
              </v-btn>
              <v-btn @click.stop="closeFile" variant="text" size="small">
                ✕
              </v-btn>
            </div>
          </div>

          <div class="wiki-content">
            <div v-if="!isEditing" class="wiki-display">
              <p>{{ selectedPage.content || 'Bu dosya henüz boş.' }}</p>
            </div>

            <div v-else class="wiki-editor">
              <v-textarea v-model="editingContent" placeholder="Dosya içeriğini yazın..." rows="10"
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

// ============================================================================
// REACTIVE STATE
// ============================================================================

// Game data
const game = ref(null)
const isGM = ref(false)

// Dropdown state
const showDropdown = ref(false)

// Sidebar state
const showAddMenu = ref(false)
const showContextMenu = ref(false)
const showInlineInput = ref(false)
const newItemName = ref('')
const newItemType = ref('') // 'page' or 'folder'
const newItemParentId = ref(null) // parent_id for new items
const menuPosition = ref({ top: '0px', left: '0px' })
const contextMenuTarget = ref(null) // Store the item that was right-clicked
const templatesExpanded = ref(false)
const filterText = ref('')
const searchText = ref('')
const inlineInputRef = ref(null)

// Wiki pages and folders
const wikiItems = ref([]) // Combined pages and folders
const selectedPage = ref(null)
const isEditing = ref(false)
const editingContent = ref('')

// Drag & Drop state
const draggedItem = ref(null)
const dragOverItem = ref(null)
const isDragging = ref(false)

// ============================================================================
// COMPUTED PROPERTIES
// ============================================================================

// Computed filtered items
const filteredWikiItems = computed(() => {
  if (!filterText.value) return wikiItems.value
  return wikiItems.value.filter(item =>
    item.title.toLowerCase().includes(filterText.value.toLowerCase())
  )
})

// Helper function to build tree structure
const buildTreeStructure = (items) => {
  const itemMap = new Map()
  const roots = []

  // Create map of all items
  items.forEach(item => {
    itemMap.set(item.id, { ...item, children: [] })
  })

  // Build tree structure
  items.forEach(item => {
    const node = itemMap.get(item.id)
    if (item.parent_id) {
      const parent = itemMap.get(item.parent_id)
      if (parent) {
        parent.children.push(node)
      }
    } else {
      roots.push(node)
    }
  })

  return roots
}

// Computed tree structure
const wikiTree = computed(() => {
  return buildTreeStructure(filteredWikiItems.value)
})

// ============================================================================
// DATA LOADING FUNCTIONS
// ============================================================================

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

    // Load wiki items
    await loadWikiItems()
  } catch (error) {
    console.error('Oyun yüklenirken hata:', error)
  }
}

// Load wiki items (all items are files, some act as folders)
const loadWikiItems = async () => {
  try {
    // Load all files
    const { data: files, error: filesError } = await supabase
      .from('wiki_pages')
      .select('*')
      .eq('game_id', route.params.id)
      .order('created_at', { ascending: true })

    if (filesError) throw filesError

    // All items are files, but some can contain other files (act as folders)
    const allItems = (files || []).map(file => ({
      ...file,
      type: 'file',
      isFolder: file.content === 'FOLDER_MARKER' || file.content === '' // Empty content or folder marker
    }))

    wikiItems.value = allItems
  } catch (error) {
    console.error('Wiki öğeleri yüklenirken hata:', error)
  }
}

// ============================================================================
// CONTEXT MENU FUNCTIONS
// ============================================================================

// Show context menu
const handleContextMenu = (event, targetItem) => {
  console.log('Context menu triggered, isGM:', isGM.value, 'Target item:', targetItem)
  // Temporarily allow all users to use context menu for testing

  event.preventDefault()
  event.stopPropagation()

  // Store the target item for context menu actions
  contextMenuTarget.value = targetItem

  // Calculate position relative to viewport
  const rect = event.currentTarget.getBoundingClientRect()
  const x = event.clientX
  const y = event.clientY

  // Ensure menu doesn't go off screen
  const menuWidth = 180
  const menuHeight = 100
  const windowWidth = window.innerWidth
  const windowHeight = window.innerHeight

  let left = x
  let top = y

  // Adjust if menu would go off right edge
  if (x + menuWidth > windowWidth) {
    left = x - menuWidth
  }

  // Adjust if menu would go off bottom edge
  if (y + menuHeight > windowHeight) {
    top = y - menuHeight
  }

  menuPosition.value = {
    top: top + 'px',
    left: left + 'px'
  }
  showContextMenu.value = true
  console.log('Context menu shown for:', targetItem, 'at position:', menuPosition.value)
}

// Close context menu when clicking outside
const closeContextMenu = () => {
  showContextMenu.value = false
}

// ============================================================================
// ADD MENU FUNCTIONS
// ============================================================================

// Toggle add menu
const toggleAddMenu = () => {
  console.log('Toggle add menu clicked, isGM:', isGM.value)
  // Temporarily allow all users to add pages for testing
  showAddMenu.value = !showAddMenu.value
  console.log('Add menu toggled:', showAddMenu.value)
}

// Close add menu when clicking outside
const closeAddMenu = () => {
  showAddMenu.value = false
}

// ============================================================================
// WIKI ITEM CREATION FUNCTIONS
// ============================================================================

// Start creating a new file
const startCreateFile = () => {
  console.log('startCreateFile called')

  // Close menus
  showAddMenu.value = false
  showContextMenu.value = false

  // Set up for file creation
  newItemType.value = 'file'
  newItemName.value = ''

  // Determine parent based on context
  if (contextMenuTarget.value && contextMenuTarget.value.isFolder) {
    // Right-clicked on a folder - create inside it
    newItemParentId.value = contextMenuTarget.value.id
    console.log('Creating file inside folder:', contextMenuTarget.value.title)
  } else if (contextMenuTarget.value) {
    // Right-clicked on a file - create next to it
    newItemParentId.value = contextMenuTarget.value.parent_id
    console.log('Creating file next to:', contextMenuTarget.value.title)
  } else {
    // Right-clicked on empty space - create at root
    newItemParentId.value = null
    console.log('Creating file at root level')
  }

  // Show input
  showInlineInput.value = true

  // Focus input after DOM update
  nextTick(() => {
    if (inlineInputRef.value) {
      inlineInputRef.value.focus()
      console.log('Input focused for file creation')
    }
  })
}

// Start creating a new folder (empty file that can contain other files)
const startCreateFolder = () => {
  console.log('startCreateFolder called')

  // Close menus
  showAddMenu.value = false
  showContextMenu.value = false

  // Set up for folder creation
  newItemType.value = 'folder'
  newItemName.value = ''

  // Determine parent based on context
  if (contextMenuTarget.value && contextMenuTarget.value.isFolder) {
    // Right-clicked on a folder - create inside it
    newItemParentId.value = contextMenuTarget.value.id
    console.log('Creating folder inside folder:', contextMenuTarget.value.title)
  } else if (contextMenuTarget.value) {
    // Right-clicked on a file - create next to it
    newItemParentId.value = contextMenuTarget.value.parent_id
    console.log('Creating folder next to:', contextMenuTarget.value.title)
  } else {
    // Right-clicked on empty space - create at root
    newItemParentId.value = null
    console.log('Creating folder at root level')
  }

  // Show input
  showInlineInput.value = true

  // Focus input after DOM update
  nextTick(() => {
    if (inlineInputRef.value) {
      inlineInputRef.value.focus()
      console.log('Input focused for folder creation')
    }
  })
}

// Save the new item
const saveNewItem = async () => {
  const itemName = newItemName.value.trim()

  console.log('saveNewItem called:', {
    name: itemName,
    type: newItemType.value,
    parentId: newItemParentId.value
  })

  // Validate input
  if (!itemName) {
    console.log('Empty name, cancelling...')
    cancelNewItem()
    return
  }

  try {
    if (newItemType.value === 'file') {
      console.log('Creating file:', itemName)

      const { data, error } = await supabase
        .from('wiki_pages')
        .insert({
          game_id: route.params.id,
          title: itemName,
          content: 'New file content...', // Default content for files
          parent_id: newItemParentId.value
        })
        .select()
        .single()

      if (error) {
        console.error('File creation error:', error)
        throw error
      }

      console.log('File created successfully:', data)
      wikiItems.value.push({ ...data, type: 'file', isFolder: false })

    } else if (newItemType.value === 'folder') {
      console.log('Creating folder:', itemName)

      // Create folder as empty file that can contain other files
      const { data, error } = await supabase
        .from('wiki_pages')
        .insert({
          game_id: route.params.id,
          title: itemName,
          content: '', // Empty content makes it a folder
          parent_id: newItemParentId.value
        })
        .select()
        .single()

      if (error) {
        console.error('Folder creation error:', error)
        throw error
      }

      console.log('Folder created successfully:', data)
      wikiItems.value.push({ ...data, type: 'file', isFolder: true })
    }

    // Success - close input
    cancelNewItem()

  } catch (error) {
    console.error('Error creating item:', error)
    // Keep input open on error so user can retry
  }
}

// Cancel item creation
const cancelNewItem = () => {
  console.log('Cancelling item creation')

  // Reset all state
  showInlineInput.value = false
  newItemName.value = ''
  newItemType.value = ''
  newItemParentId.value = null
  contextMenuTarget.value = null
}

// ============================================================================
// WIKI PAGE FUNCTIONS
// ============================================================================

// Select file
const selectFile = (file) => {
  console.log('Selecting file:', file.title)

  // Only select if it's not a folder
  if (!file.isFolder) {
    // Check if file is already selected
    if (selectedPage.value?.id === file.id) {
      console.log('File already selected:', file.title)
      return
    }

    selectedPage.value = file
    isEditing.value = false // Reset editing state when selecting new file
    console.log('File selected successfully:', file.title)
  } else {
    console.log('Cannot select folder as file:', file.title)
  }
}

// Close file
const closeFile = () => {
  console.log('Closing file')
  selectedPage.value = null
  isEditing.value = false
}

// Edit file
const editFile = () => {
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

// ============================================================================
// TREE NAVIGATION FUNCTIONS
// ============================================================================

// Toggle templates
const toggleTemplates = () => {
  templatesExpanded.value = !templatesExpanded.value
}

// Handle item click (file or folder)
const handleItemClick = (item) => {
  console.log('Item clicked:', item.title, 'isFolder:', item.isFolder)

  if (item.isFolder) {
    // If it's a folder, toggle it
    toggleFolder(item)
  } else {
    // If it's a file, select it
    selectFile(item)
  }
}

// Toggle folder expansion
const toggleFolder = (folder) => {
  if (folder.isFolder) {
    console.log('Toggling folder:', folder.title, 'from', folder.expanded, 'to', !folder.expanded)
    folder.expanded = !folder.expanded
  }
}

// ============================================================================
// DRAG & DROP FUNCTIONS
// ============================================================================

const handleDragStart = (event, item) => {
  draggedItem.value = item
  isDragging.value = true
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', item.id)
}

const handleDragOver = (event, item) => {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'move'
  dragOverItem.value = item
}

const handleDragEnter = (event, item) => {
  event.preventDefault()
  dragOverItem.value = item
}

const handleDragLeave = (event) => {
  dragOverItem.value = null
}

const handleDrop = async (event, targetItem) => {
  event.preventDefault()

  if (!draggedItem.value || !targetItem || draggedItem.value.id === targetItem.id) {
    return
  }

  // Prevent dropping into itself or its own children
  if (isDescendant(draggedItem.value, targetItem)) {
    return
  }

  try {
    const newParentId = targetItem.isFolder ? targetItem.id : targetItem.parent_id

    // All items are files, just update parent_id
    const { error } = await supabase
      .from('wiki_pages')
      .update({ parent_id: newParentId })
      .eq('id', draggedItem.value.id)

    if (error) throw error

    // Update local state
    const itemIndex = wikiItems.value.findIndex(item => item.id === draggedItem.value.id)
    if (itemIndex !== -1) {
      wikiItems.value[itemIndex].parent_id = newParentId
    }

  } catch (error) {
    console.error('Öğe taşınırken hata:', error)
  } finally {
    draggedItem.value = null
    dragOverItem.value = null
    isDragging.value = false
  }
}

// Helper function to check if an item is a descendant of another
const isDescendant = (potentialChild, potentialParent) => {
  if (!potentialChild || !potentialParent) return false
  if (potentialChild.id === potentialParent.id) return true

  const parent = wikiItems.value.find(item => item.id === potentialChild.parent_id)
  if (!parent) return false

  return isDescendant(parent, potentialParent)
}

// ============================================================================
// DROPDOWN NAVIGATION FUNCTIONS
// ============================================================================

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

// ============================================================================
// LIFECYCLE
// ============================================================================

// Close menus when clicking outside
onMounted(() => {
  loadGame()
  document.addEventListener('click', (event) => {
    // Close dropdown if clicking outside
    const dropdown = document.querySelector('.dropdown-container')
    if (dropdown && !dropdown.contains(event.target)) {
      showDropdown.value = false
    }

    // Close context menu if clicking outside
    const contextMenu = document.querySelector('.context-menu')
    if (contextMenu && !contextMenu.contains(event.target)) {
      closeContextMenu()
    }

    // Close add menu if clicking outside
    const addMenu = document.querySelector('.add-menu')
    if (addMenu && !addMenu.contains(event.target)) {
      closeAddMenu()
    }

    // Don't close file view when clicking outside - let user explicitly close it
  })
})
</script>

<style scoped>
/* ============================================================================
   MAIN LAYOUT
   ============================================================================ */

.game-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 50%, #2A2A2A 100%);
  color: #ffffff;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.game-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* ============================================================================
   HEADER STYLES
   ============================================================================ */

.game-header {
  background: rgba(45, 45, 45, 0.8);
  backdrop-filter: blur(8px);
  padding: 0.75rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(218, 165, 32, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  position: relative;
  z-index: 99998;
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

/* ============================================================================
   DROPDOWN STYLES
   ============================================================================ */

.dropdown-container {
  position: relative;
  z-index: 99999;
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
  z-index: 99999;
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

/* ============================================================================
   BUTTON STYLES
   ============================================================================ */

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

/* ============================================================================
   SIDEBAR STYLES
   ============================================================================ */

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

/* ============================================================================
   WIKI TREE STYLES
   ============================================================================ */

.wiki-tree {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.005);
}

.tree-item {
  margin-bottom: 0.25rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.3s ease;
  border: 1px solid transparent;
  font-size: 0.9rem;
  user-select: none;
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

.tree-item.dragging {
  opacity: 0.5;
  transform: scale(0.95);
}

.tree-item.drag-over {
  background: rgba(218, 165, 32, 0.15);
  border-color: rgba(218, 165, 32, 0.4);
  box-shadow: 0 0 0 2px rgba(218, 165, 32, 0.3);
}

.folder-item {
  font-weight: 600;
  color: #DAA520;
}

.file-item {
  color: #B0BEC5;
  font-weight: 400;
}

.item-content {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.item-icon {
  font-size: 1rem;
  width: 20px;
  text-align: center;
}

.item-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.folder-toggle {
  font-size: 0.8rem;
  color: #DAA520;
  margin-left: auto;
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

.templates {
  font-weight: 600;
  color: #DAA520;
  font-size: 0.9rem;
}

/* ============================================================================
   MENU STYLES
   ============================================================================ */

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
  z-index: 99999;
  min-width: 180px;
  padding: 8px 0;
  pointer-events: auto;
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
  padding: 1rem;
  border-bottom: 1px solid rgba(218, 165, 32, 0.1);
  background: rgba(255, 255, 255, 0.02);
  border-top: 1px solid rgba(218, 165, 32, 0.1);
}

.input-container {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(218, 165, 32, 0.3);
  border-radius: 8px;
  padding: 8px 12px;
}

.inline-input-field {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #ffffff;
  font-size: 0.9rem;
  padding: 4px 0;
}

.inline-input-field::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.input-actions {
  display: flex;
  gap: 4px;
}

.save-btn,
.cancel-btn {
  background: none;
  border: none;
  color: #ffffff;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  transition: all 0.2s ease;
}

.save-btn:hover {
  background: rgba(76, 175, 80, 0.2);
  color: #4CAF50;
}

.cancel-btn:hover {
  background: rgba(244, 67, 54, 0.2);
  color: #F44336;
}

/* ============================================================================
   MAIN CONTENT STYLES
   ============================================================================ */

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

/* ============================================================================
   WIKI PAGE STYLES
   ============================================================================ */

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
</style>