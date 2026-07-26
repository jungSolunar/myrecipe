import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ApiError } from '../../api';
import type { InventoryItem, InventoryWriteRequest } from '../../api/inventory';
import { Alert, Button, ConfirmDialog, EmptyState, ErrorState, Icon, TextField, Toast } from '../../components';
import { InventoryAddForm } from './InventoryAddForm';
import { InventoryWizard } from './InventoryWizard';
import { InventoryTable } from './InventoryTable';
import type { InventoryRowData } from './InventoryTable';
import type { InventoryEditValues } from './InventoryRow';
import {
  useCreateInventory,
  useDeleteInventory,
  useInventoryList,
  useMasterOptions,
  useUpdateInventory,
} from './useInventory';
import './inventory.css';

/** 유통기한 임박순 정렬: 기한 있는 항목을 날짜 오름차순으로, 미입력은 뒤로. */
function byExpiry(a: InventoryItem, b: InventoryItem): number {
  const ax = a.expires_at ?? null;
  const bx = b.expires_at ?? null;
  if (ax && bx) return ax < bx ? -1 : ax > bx ? 1 : 0;
  if (ax) return -1;
  if (bx) return 1;
  return 0;
}

/** US-011 보유 식재료(재고) 관리 화면. */
export function InventoryPage() {
  const list = useInventoryList();
  const master = useMasterOptions();
  const createMut = useCreateInventory();
  const updateMut = useUpdateInventory();
  const deleteMut = useDeleteInventory();

  const [params, setParams] = useSearchParams();
  const wizardOpen = params.get('wizard') === '1';
  const prefillFirst = (params.get('prefill') ?? '').split(',')[0] || undefined;

  function openWizard() {
    const sp = new URLSearchParams(params);
    sp.set('wizard', '1');
    setParams(sp);
  }
  function closeWizard() {
    const sp = new URLSearchParams(params);
    sp.delete('wizard');
    sp.delete('prefill');
    setParams(sp);
  }

  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [depleteTarget, setDepleteTarget] = useState<InventoryItem | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const items = useMemo(() => list.data?.data ?? [], [list.data]);
  const masterList = useMemo(() => master.data?.data ?? [], [master.data]);
  const categoryById = useMemo(
    () => new Map(masterList.map((m) => [m.id, m.category ?? null])),
    [masterList],
  );

  const rows: InventoryRowData[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((it) => !q || (it.ingredient_name ?? '').toLowerCase().includes(q))
      .slice()
      .sort(byExpiry)
      .map((it) => ({ ...it, category: categoryById.get(it.ingredient_id) ?? null }));
  }, [items, query, categoryById]);

  const isEmpty = list.isSuccess && items.length === 0;

  async function handleAdd(body: InventoryWriteRequest) {
    setAddError(null);
    try {
      await createMut.mutateAsync(body);
      const name = masterList.find((m) => m.id === body.ingredient_id)?.name ?? '재료';
      setToast(`“${name}”을(를) 재고에 추가했어요.`);
    } catch (err) {
      setAddError(
        err instanceof ApiError ? err.message : '추가에 실패했어요. 다시 시도해 주세요.',
      );
      throw err;
    }
  }

  async function handleSave(item: InventoryItem, values: InventoryEditValues) {
    // 수량 0 저장 → 소진 처리 확인으로 위임 (US-011 AC2)
    if (values.quantity === 0) {
      setEditingId(null);
      setDepleteTarget(item);
      return;
    }
    try {
      await updateMut.mutateAsync({
        id: item.id,
        body: {
          ingredient_id: item.ingredient_id,
          quantity: values.quantity,
          unit: item.unit ?? null,
          expires_at: values.expires_at,
          storage_location: values.storage_location,
        },
      });
      setEditingId(null);
      setToast('수정했어요.');
    } catch {
      setToast('수정에 실패했어요. 다시 시도해 주세요.');
    }
  }

  async function confirmDeplete() {
    if (!depleteTarget) return;
    const name = depleteTarget.ingredient_name ?? '재료';
    try {
      await deleteMut.mutateAsync(depleteTarget.id);
      setDepleteTarget(null);
      setToast(`“${name}”을(를) 소진 처리했어요.`);
    } catch {
      setToast('소진 처리에 실패했어요. 다시 시도해 주세요.');
    }
  }

  return (
    <main id="main" className="inv-page">
      <h1 className="inv-title">내 재고</h1>
      <p className="inv-sub">
        집에 있는 재료의 수량과 유통기한을 등록해 두면, 레시피 상세에서 부족한 재료를 자동으로
        알려드려요. (로그인 회원 전용)
      </p>

      {/* 재고 추가 (US-011 AC1, US-022 위저드) */}
      {master.isLoading ? (
        <div className="inv-card">
          <p role="status">재료 목록을 불러오는 중…</p>
        </div>
      ) : master.isError ? (
        <div className="inv-card">
          <Alert variant="error">재료 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</Alert>
        </div>
      ) : wizardOpen ? (
        <InventoryWizard
          masterOptions={masterList}
          prefillIngredientId={prefillFirst}
          onClose={closeWizard}
          onCreated={(name) => setToast(`“${name}”을(를) 재고에 추가했어요.`)}
        />
      ) : (
        <>
          <InventoryAddForm
            masterOptions={masterList}
            existingIngredientIds={items.map((it) => it.ingredient_id)}
            submitting={createMut.isPending}
            formError={addError}
            onSubmit={handleAdd}
          />
          {masterList.length > 0 && (
            <div className="inv-wizard-entry">
              <Button variant="ghost" size="sm" onClick={openWizard} iconLeft={<Icon name="box" size={14} />}>
                단계별로 추가
              </Button>
            </div>
          )}
        </>
      )}

      {/* 재고 목록 (3-상태) */}
      <div className="inv-card">
        <div className="inv-searchbar">
          <TextField
            label="재고 검색"
            hideLabel
            type="search"
            placeholder="재료명으로 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="inv-legend" aria-hidden="true">
          <span>
            <span className="expiry-badge expiry-badge--ok">넉넉</span> 유통기한 여유
          </span>
          <span>
            <span className="expiry-badge expiry-badge--soon">임박</span> 3일 이내
          </span>
          <span>
            <span className="expiry-badge expiry-badge--expired">만료</span> 기한 지남
          </span>
        </div>

        {list.isLoading ? (
          <div className="inv-skel-group" aria-hidden="true">
            <div className="inv-skel" style={{ width: '40%' }} />
            <div className="inv-skel inv-skel--row" />
            <div className="inv-skel inv-skel--row" />
            <div className="inv-skel inv-skel--row" />
          </div>
        ) : list.isError ? (
          <ErrorState
            title="재고 목록을 불러오지 못했어요"
            onRetry={() => void list.refetch()}
          />
        ) : isEmpty ? (
          <EmptyState
            icon={<Icon name="box" size={32} />}
            title="아직 등록한 재고가 없어요"
            description="위 ‘재고 추가’에서 집에 있는 재료를 등록해 보세요. 등록하면 레시피 상세에서 부족 재료를 알려드려요."
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Icon name="search" size={32} />}
            title={`“${query}”와 일치하는 재고가 없어요`}
            description="다른 재료명으로 검색해 보세요."
          />
        ) : (
          <InventoryTable
            rows={rows}
            editingId={editingId}
            savingId={updateMut.isPending ? editingId : null}
            onStartEdit={(id) => setEditingId(id)}
            onCancelEdit={() => setEditingId(null)}
            onSave={(item, values) => void handleSave(item, values)}
            onDeplete={(item) => setDepleteTarget(item)}
          />
        )}
      </div>

      {/* 소진/삭제 확인 (US-011 AC2) */}
      <ConfirmDialog
        open={depleteTarget !== null}
        title={
          depleteTarget
            ? `“${depleteTarget.ingredient_name ?? '재료'}”를 재고에서 제거할까요?`
            : '재고에서 제거할까요?'
        }
        description="보유 목록에서 소진 처리됩니다. 식재료 마스터 항목은 그대로 유지돼요."
        confirmLabel="소진 처리"
        loading={deleteMut.isPending}
        onCancel={() => setDepleteTarget(null)}
        onConfirm={() => void confirmDeplete()}
      />

      {toast && <Toast onDismiss={() => setToast(null)}>{toast}</Toast>}

      <p className="inv-footnote">
        찾는 재료가 없나요? <Link to="/ingredients">식재료 마스터에서 먼저 등록</Link>하세요.
      </p>
    </main>
  );
}
