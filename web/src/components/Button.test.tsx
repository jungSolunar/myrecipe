import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('클릭 이벤트를 전달한다', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>저장</Button>);
    await userEvent.click(screen.getByRole('button', { name: '저장' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('loading 이면 aria-busy 이고 비활성화된다', async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        저장
      </Button>,
    );
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(btn).toBeDisabled();
    await userEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });
});
