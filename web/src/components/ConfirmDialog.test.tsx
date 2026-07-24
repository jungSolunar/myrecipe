import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog (US-007)', () => {
  function setup(loading = false) {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        open
        title="레시피를 삭제할까요?"
        description="되돌릴 수 없습니다."
        loading={loading}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    return { onConfirm, onCancel };
  }

  it('dialog 역할과 제목/설명 연결을 갖는다', () => {
    setup();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('heading', { name: '레시피를 삭제할까요?' })).toBeInTheDocument();
  });

  it('삭제 버튼 클릭 시 onConfirm 을 호출한다', async () => {
    const { onConfirm } = setup();
    await userEvent.click(screen.getByRole('button', { name: '삭제' }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('ESC 로 취소된다', async () => {
    const { onCancel } = setup();
    await userEvent.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('로딩 중에는 ESC 로 닫히지 않는다', async () => {
    const { onCancel } = setup(true);
    await userEvent.keyboard('{Escape}');
    expect(onCancel).not.toHaveBeenCalled();
  });
});
