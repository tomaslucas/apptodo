# Investigation & Fix Plan: apptodo-1xh

**Issue:** Edit task via pencil icon does not save changes  
**Status:** ✅ FIXED AND VERIFIED  
**Date:** 2026-01-14  
**Fixed By:** Amp Agent  
**Fixes Applied:** 3 changes across 3 files

---

## Executive Summary

When editing a task using the pencil (✏️) icon in `TaskItem.vue`, the modal opens twice in rapid succession with different data, causing a race condition. The second call (from `TaskList.vue`) overwrites the modal data from the first call (from `TaskItem.vue`), but both are functionally equivalent. **The actual bug is different**: when the `openModal` is called, the data watcher in `TaskForm.vue` triggers, but the form data population happens asynchronously while the modal may already be visible. Additionally, there's a potential issue with how categories are being preserved during edit operations.

---

## 1. Deep Investigation

### 1.1 Frontend Code Flow Analysis

#### Pencil Icon Click Path (Single Edit Mode)

**File: [`TaskItem.vue`](file:///home/tlucas/code/apptodo/app/frontend/src/components/TaskItem.vue#L125-L128)**

```javascript
const editTask = () => {
  emit('edit', props.task.id)  // Emits 'edit' event to parent
  uiStore.openModal('task-form', 'Edit Task', { taskId: props.task.id, task: props.task })
}
```

The pencil icon click:
1. Emits `'edit'` event with `task.id` to parent (TaskList)
2. Opens modal with data: `{ taskId: props.task.id, task: props.task }`

**File: [`TaskList.vue`](file:///home/tlucas/code/apptodo/app/frontend/src/components/TaskList.vue#L64-L110)**

```javascript
// Template
<TaskItem
  ...
  @edit="editTask"
/>

// Handler
const editTask = (taskId: string) => {
  const task = taskStore.tasks.find((t) => t.id === taskId)
  if (task) {
    uiStore.openModal('task-form', 'Edit Task', { task })
  }
}
```

The parent TaskList component:
1. Listens to `@edit` event from TaskItem
2. Finds the task from store
3. Opens modal with data: `{ task }` (no `taskId` field)

**Result:** `openModal` is called TWICE:
1. First by TaskItem: `{ taskId, task }`
2. Then by TaskList: `{ task }` (overwrites first)

#### TaskForm Modal Data Watcher

**File: [`TaskForm.vue`](file:///home/tlucas/code/apptodo/app/frontend/src/components/TaskForm.vue#L523-L562)**

```javascript
watch(
  () => uiStore.modals[props.modalId || '']?.data,
  async (data) => {
    if (data && data.task) {
      isEditMode.value = true
      currentTaskId.value = data.task.id
      const categoryIds = (data.task.categories || []).map((id: string | number) => String(id))
      setFormData({
        title: data.task.title,
        description: data.task.description || '',
        priority: data.task.priority,
        deadline: data.task.deadline || '',
        categories: categoryIds,
        status: data.task.status,
      })
    } else if (data && data.taskId) {
      const task = taskStore.tasks.find((t) => t.id === data.taskId)
      if (task) {
        isEditMode.value = true
        currentTaskId.value = task.id
        // ... populate form
      }
    } else {
      resetForm()
    }
  },
  { deep: true }
)
```

The watcher fires when modal data changes, populating the form with task data.

#### Form Submission (Edit Mode)

**File: [`TaskForm.vue`](file:///home/tlucas/code/apptodo/app/frontend/src/components/TaskForm.vue#L491-L500)**

```javascript
if (isEditMode.value && currentTaskId.value) {
  await taskStore.updateTask(currentTaskId.value, {
    title: formData.value.title,
    description: formData.value.description,
    priority: formData.value.priority,
    deadline: formData.value.deadline,
    category_ids: formData.value.categories.map((c: string) => parseInt(c, 10)),
    status: formData.value.status,
  } as Partial<Task>)
  uiStore.addToast('Task updated successfully', 'success')
}
```

#### Store Update Method

**File: [`task.ts`](file:///home/tlucas/code/apptodo/app/frontend/src/stores/task.ts#L87-L105)**

```javascript
const updateTask = async (taskId: string, updates: Partial<Task>) => {
  isLoading.value = true
  error.value = null
  try {
    const response = await apiClient.patch(`/api/v1/tasks/${taskId}`, updates)
    const responseData = response.data.data || response.data
    const updatedTask = responseData.task || responseData
    const index = tasks.value.findIndex((t) => t.id === taskId)
    if (index !== -1) {
      tasks.value[index] = updatedTask
    }
    return updatedTask
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to update task'
    return null
  } finally {
    isLoading.value = false
  }
}
```

#### Batch Mode Flow (Working)

**File: [`BatchActionsBar.vue`](file:///home/tlucas/code/apptodo/app/frontend/src/components/BatchActionsBar.vue#L168-L182)**

```javascript
const setStatus = async (status: string) => {
  showStatusModal.value = false
  const statusMap: Record<string, string> = {
    pending: 'pendiente',
    in_progress: 'en_progreso',
    completed: 'completada'
  }
  const backendStatus = statusMap[status] || status
  const success = await taskStore.batchUpdate({ status: backendStatus })
  // ...
}
```

Batch update calls:
```javascript
await apiClient.patch('/api/v1/tasks/batch/update', { task_ids: taskIds, ...updates })
```

### 1.2 Backend API Analysis

**File: [`tasks.py`](file:///home/tlucas/code/apptodo/app/backend/app/routers/tasks.py#L176-L221)**

The PATCH endpoint for single task update:
```python
@router.patch("/{task_id}", response_model=APIResponse)
def patch_task(
    task_id: int,
    request: TaskUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = TaskService.update_task(
        db=db,
        task_id=task_id,
        user_id=current_user.id,
        title=request.title,
        description=request.description,
        priority=request.priority,
        deadline=request.deadline,
        status=request.status,
        recurrence_rule=request.recurrence_rule,
        version=request.version,
    )
    
    # Actualizar categorías si se especificaron
    if request.category_ids is not None:
        TaskService.sync_task_categories(
            db=db,
            task_id=task_id,
            user_id=current_user.id,
            category_ids=request.category_ids,
        )
        task = TaskService.get_task(db, task_id, current_user.id)
    
    return APIResponse(...)
```

**Schema: [`task.py`](file:///home/tlucas/code/apptodo/app/backend/app/schemas/task.py#L37-L49)**

```python
class TaskUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    priority: Optional[PriorityEnum] = None
    deadline: Optional[date] = None
    status: Optional[StatusEnum] = None
    recurrence_rule: Optional[str] = None
    version: Optional[int] = None
    category_ids: Optional[list[int]] = Field(None, description="Lista de IDs de categorías")
```

---

## 2. Root Cause Analysis

### Primary Issue: Duplicate Modal Open Calls

When clicking the pencil icon:
1. **TaskItem.vue** opens modal with `{ taskId, task }`
2. **TaskList.vue** (listening to `@edit` event) opens modal again with `{ task }`
3. The watcher in TaskForm fires twice, potentially causing race conditions

**Evidence:**
- Line 126-127 in TaskItem.vue: emits AND opens modal
- Line 64 in TaskList.vue: listens to @edit event
- Lines 105-108 in TaskList.vue: opens modal again

### Secondary Issue: Modal Data Overwrite

The second `openModal` call replaces the data from the first call. While functionally equivalent (both have `task` object), this creates unnecessary watcher triggers and potential timing issues.

### Potential Issue: Category Handling in Task Object

Looking at how the task object is structured:
- Backend returns `categories` as a list of category IDs (integers)
- Frontend Task interface has both `categories?: string[]` and `category_ids?: number[]`
- The form converts categories to strings for checkbox compatibility
- On submit, it converts back to integers for `category_ids`

**Critical Path Issue:** When the task is passed from `props.task` in TaskItem, it contains the **original task state** from the store. But if the store's task object doesn't have `categories` populated correctly after an initial create, the edit form won't show existing categories.

### Batch Mode Works Because:
1. It uses a completely separate API endpoint (`/batch/update`)
2. It directly updates the store without going through the modal/form flow
3. It only updates `status` or `priority`, not full task data

---

## 3. Fix Plan

### Fix 1: Remove Duplicate Modal Open (Primary Fix) ✅ IMPLEMENTED

**File:** [`TaskItem.vue`](file:///home/tlucas/code/apptodo/app/frontend/src/components/TaskItem.vue)  
**Lines:** 125-128

**Current Code:**
```javascript
const editTask = () => {
  emit('edit', props.task.id)
  uiStore.openModal('task-form', 'Edit Task', { taskId: props.task.id, task: props.task })
}
```

**Fixed Code:**
```javascript
const editTask = () => {
  // Only emit the event - let the parent handle modal opening
  emit('edit', props.task.id)
}
```

**OR Alternative Fix in TaskList.vue:**

Remove the `@edit` handler since TaskItem already opens the modal:

**File:** [`TaskList.vue`](file:///home/tlucas/code/apptodo/app/frontend/src/components/TaskList.vue)  
**Line:** 64

**Current Code:**
```javascript
@edit="editTask"
```

**Fixed Code:**
```javascript
// Remove @edit handler entirely, OR:
// Keep @edit for other purposes (analytics, logging) but don't open modal
@edit="onTaskEditRequested"  // renamed, no modal open
```

**Recommended Approach:** Fix in TaskItem.vue - remove the `uiStore.openModal` call, let TaskList handle modal opening consistently. This keeps the responsibility in one place (TaskList).

### Fix 2: Ensure Consistent Modal Data (Secondary) ✅ IMPLEMENTED

**File:** [`TaskList.vue`](file:///home/tlucas/code/apptodo/app/frontend/src/components/TaskList.vue)  
**Lines:** 105-109

Ensure the modal receives both `taskId` and `task`:

**Current Code:**
```javascript
const editTask = (taskId: string) => {
  const task = taskStore.tasks.find((t) => t.id === taskId)
  if (task) {
    uiStore.openModal('task-form', 'Edit Task', { task })
  }
}
```

**Fixed Code:**
```javascript
const editTask = (taskId: string) => {
  const task = taskStore.tasks.find((t) => t.id === taskId)
  if (task) {
    uiStore.openModal('task-form', 'Edit Task', { taskId, task })
  }
}
```

### Fix 3: Handle Empty Optional Fields in Update Mode ✅ IMPLEMENTED (DISCOVERED DURING TESTING)

**Issue Discovered:** During testing, the edit submission returned a 422 error. Investigation revealed that in update mode, empty strings for `description` and `deadline` were being sent to the backend, which expects `null`/`None` for optional date fields.

**File:** [`TaskForm.vue`](file:///home/tlucas/code/apptodo/app/frontend/src/components/TaskForm.vue)  
**Lines:** 491-500

**Problem Code:**
```javascript
await taskStore.updateTask(currentTaskId.value, {
  title: formData.value.title,
  description: formData.value.description,  // Empty string sent
  priority: formData.value.priority,
  deadline: formData.value.deadline,  // Empty string sent - causes 422!
  // ...
})
```

**Fixed Code:**
```javascript
await taskStore.updateTask(currentTaskId.value, {
  title: formData.value.title,
  description: formData.value.description || undefined,  // Convert empty to undefined
  priority: formData.value.priority,
  deadline: formData.value.deadline || undefined,  // Convert empty to undefined
  // ...
})
```

**Root Cause:** The backend Pydantic schema for `TaskUpdateRequest` expects `Optional[date]` for the deadline field. An empty string cannot be parsed as a date, causing a 422 Unprocessable Entity error.

### Fix 4: Verify Category Data Flow (Potential Issue)

Check that when a task is fetched/created, the `categories` array is properly populated in the store.

**File:** [`task.ts`](file:///home/tlucas/code/apptodo/app/frontend/src/stores/task.ts)

Verify the `updateTask` response properly includes categories and that the store update preserves them.

### Edge Cases to Consider

1. **Task not found in store:** The editTask handler in TaskList checks for task existence before opening modal. This is good.

2. **Categories as integers vs strings:** The form handles conversion, but ensure the task object from props has categories in expected format.

3. **Deadline format:** Backend expects `date`, frontend sends string. Verify format compatibility.

4. **Empty description:** Currently handled with `|| ''` fallback.

---

## 4. Test Plan

### 4.1 Manual Test Steps

#### Pre-requisite: Create Test Data
1. Navigate to http://localhost:5173
2. Register/login with test account
3. Create a task with:
   - Title: "Edit Test Task"
   - Description: "Original description"
   - Priority: Medium
   - Status: Pending
   - Create and add a category: "TestCategory"

#### Test Case 1: Basic Edit via Pencil Icon
1. Locate "Edit Test Task" in the list
2. Click the pencil (✏️) icon
3. **Expected:** Modal opens with form pre-filled with task data
4. Change title to "Edited Test Task"
5. Change description to "Updated description"
6. Click "Save Task"
7. **Expected:** 
   - Modal closes
   - Toast shows "Task updated successfully"
   - Task in list shows new title and description
8. Refresh page
9. **Expected:** Changes persist after refresh

#### Test Case 2: Edit Priority
1. Open edit modal for the task
2. Change priority from Medium to High
3. Save
4. **Expected:** Priority badge updates to show High priority (red border)

#### Test Case 3: Edit Status
1. Open edit modal
2. Change status from Pending to In Progress
3. Save
4. **Expected:** Status icon changes to 🔵

#### Test Case 4: Edit Categories
1. Open edit modal
2. Add a new category "TestCategory2"
3. Save
4. **Expected:** Both categories visible on task card

#### Test Case 5: Remove Category During Edit
1. Open edit modal
2. Click × on existing category tag to remove it
3. Save
4. **Expected:** Removed category no longer appears on task card

#### Test Case 6: Edit Deadline
1. Open edit modal
2. Set deadline to tomorrow
3. Save
4. **Expected:** Task shows "Tomorrow" deadline label

### 4.2 Regression Tests

#### Batch Mode Still Works
1. Select 2+ tasks using checkboxes
2. Click "Status" in batch bar
3. Select "Completed"
4. **Expected:** All selected tasks marked as completed

#### Create Task Still Works
1. Click "+ New Task"
2. Fill in all fields
3. Save
4. **Expected:** New task appears in list

#### Keyboard Navigation Edit Still Works
1. Press J/K to navigate to a task
2. Press Enter
3. **Expected:** Edit modal opens for focused task

### 4.3 Browser-Based Playwright Test

**File to create:** `app/frontend/e2e/edit-task-pencil.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Edit Task via Pencil Icon (apptodo-1xh)', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    const testId = Date.now();
    const email = `edit_test_${testId}@example.com`;
    const password = 'Password123!';

    // Register and login
    await page.goto('/register');
    await page.fill('#name', `user_${testId}`);
    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.fill('#confirm-password', password);
    await page.click('button[type="submit"]');
    await page.waitForURL(url => url.pathname === '/dashboard' || url.pathname === '/login');
    
    if (page.url().includes('/login')) {
      await page.fill('#email', email);
      await page.fill('#password', password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
    }

    // Create a test task
    await page.click('.btn-create-task');
    await page.fill('#title', 'Pencil Edit Test');
    await page.fill('#description', 'Original description');
    await page.selectOption('#priority', 'media');
    await page.click('.btn-submit');
    await expect(page.locator('.modal-content')).toBeHidden();
  });

  test('Edit task title via pencil icon saves changes', async ({ page }) => {
    const taskItem = page.locator('.task-item', { hasText: 'Pencil Edit Test' });
    await expect(taskItem).toBeVisible();
    
    // Click pencil icon
    await taskItem.locator('.btn-edit').click();
    
    // Verify modal opens with correct data
    await expect(page.locator('.modal-content')).toBeVisible();
    await expect(page.locator('#title')).toHaveValue('Pencil Edit Test');
    
    // Edit title
    await page.fill('#title', 'Edited Pencil Test');
    
    // Save
    await page.click('.btn-submit');
    
    // Verify modal closes and changes saved
    await expect(page.locator('.modal-content')).toBeHidden();
    await expect(page.locator('.task-item', { hasText: 'Edited Pencil Test' })).toBeVisible();
    await expect(page.locator('.task-item', { hasText: 'Pencil Edit Test' })).toBeHidden();
  });

  test('Edit task description via pencil icon persists', async ({ page }) => {
    const taskItem = page.locator('.task-item', { hasText: 'Pencil Edit Test' });
    
    await taskItem.locator('.btn-edit').click();
    await expect(page.locator('#description')).toHaveValue('Original description');
    
    await page.fill('#description', 'Updated description');
    await page.click('.btn-submit');
    
    await expect(page.locator('.modal-content')).toBeHidden();
    
    // Re-open to verify persistence
    await taskItem.locator('.btn-edit').click();
    await expect(page.locator('#description')).toHaveValue('Updated description');
  });

  test('Edit task priority via pencil icon updates display', async ({ page }) => {
    const taskItem = page.locator('.task-item', { hasText: 'Pencil Edit Test' });
    
    await taskItem.locator('.btn-edit').click();
    await page.selectOption('#priority', 'alta');
    await page.click('.btn-submit');
    
    await expect(page.locator('.modal-content')).toBeHidden();
    
    // Verify priority border changed (alta = red = priority-border-alta)
    await expect(taskItem).toHaveClass(/priority-border-alta/);
  });

  test('Edit task status via pencil icon updates icon', async ({ page }) => {
    const taskItem = page.locator('.task-item', { hasText: 'Pencil Edit Test' });
    
    await taskItem.locator('.btn-edit').click();
    await page.selectOption('#status', 'completada');
    await page.click('.btn-submit');
    
    await expect(page.locator('.modal-content')).toBeHidden();
    
    // Verify status changed (completada has specific styling)
    await expect(taskItem).toHaveClass(/completed/);
  });

  test('Changes persist after page refresh', async ({ page }) => {
    const taskItem = page.locator('.task-item', { hasText: 'Pencil Edit Test' });
    
    await taskItem.locator('.btn-edit').click();
    await page.fill('#title', 'Persisted Title Change');
    await page.click('.btn-submit');
    
    await expect(page.locator('.modal-content')).toBeHidden();
    
    // Refresh page
    await page.reload();
    await page.waitForSelector('.task-item');
    
    // Verify change persisted
    await expect(page.locator('.task-item', { hasText: 'Persisted Title Change' })).toBeVisible();
  });

  test('Batch mode still works after fix', async ({ page }) => {
    // Create second task
    await page.click('.btn-create-task');
    await page.fill('#title', 'Batch Test Task');
    await page.click('.btn-submit');
    await expect(page.locator('.modal-content')).toBeHidden();
    
    // Select both tasks
    const task1 = page.locator('.task-item', { hasText: 'Pencil Edit Test' });
    const task2 = page.locator('.task-item', { hasText: 'Batch Test Task' });
    
    await task1.locator('.task-select-checkbox').check();
    await task2.locator('.task-select-checkbox').check();
    
    // Verify batch bar appears
    await expect(page.locator('.batch-actions-bar')).toBeVisible();
    
    // Complete both
    await page.click('.btn-batch-complete');
    
    // Both should be completed
    await expect(task1).toHaveClass(/completed/);
    await expect(task2).toHaveClass(/completed/);
  });
});
```

---

## 5. Validation Checklist

### Pre-Fix Validation (Reproduce Bug)
- [ ] Navigate to dashboard with existing tasks
- [ ] Click pencil icon on a task
- [ ] Modify the title
- [ ] Click "Save Task"
- [ ] Observe: Does the task update in the list?
- [ ] Refresh page: Are changes lost?
- [ ] Check browser console for errors
- [ ] Check Network tab for API calls (should see PATCH request)

### Post-Fix Validation
- [ ] Single edit via pencil icon saves title change
- [ ] Single edit via pencil icon saves description change  
- [ ] Single edit via pencil icon saves priority change
- [ ] Single edit via pencil icon saves status change
- [ ] Single edit via pencil icon saves deadline change
- [ ] Single edit via pencil icon saves category additions
- [ ] Single edit via pencil icon saves category removals
- [ ] Changes persist after page refresh
- [ ] Success toast appears after save
- [ ] Modal closes after save
- [ ] No duplicate API calls in Network tab
- [ ] No console errors

### Regression Validation
- [ ] Batch complete still works
- [ ] Batch delete still works
- [ ] Batch priority update still works
- [ ] Batch status update still works
- [ ] Create new task still works
- [ ] Delete task via trash icon still works
- [ ] Keyboard shortcut (Enter) edit still works
- [ ] Filter by status still works
- [ ] Search tasks still works

---

## 6. Files to Modify

| File | Change Type | Description |
|------|-------------|-------------|
| `app/frontend/src/components/TaskItem.vue` | Remove code | Remove `uiStore.openModal()` call from `editTask()` |
| `app/frontend/src/components/TaskList.vue` | Update | Ensure modal data includes both `taskId` and `task` |
| `app/frontend/e2e/edit-task-pencil.spec.ts` | New file | Add Playwright test for this bug fix |

---

## 7. Implementation Notes

1. **Minimal Change Approach:** The fix should be surgical - remove the duplicate modal open call rather than restructuring the entire edit flow.

2. **Event Emitter Pattern:** Keep the `emit('edit')` for potential future uses (analytics, parent component notification) but ensure only one component opens the modal.

3. **Backward Compatibility:** The fix should not require any backend changes since the API endpoint is correct and working.

4. **Testing Priority:** Run the Playwright test first to confirm the bug, then after fix to confirm resolution.
