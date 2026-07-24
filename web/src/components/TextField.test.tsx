import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TextField } from './TextField';

describe('TextField', () => {
  it('label 이 input 과 연결된다', () => {
    render(<TextField label="이메일" />);
    // label 로 접근 가능해야 함
    expect(screen.getByLabelText(/이메일/)).toBeInTheDocument();
  });

  it('error 가 있으면 aria-invalid 와 role=alert 메시지를 노출한다', () => {
    render(<TextField label="이메일" error="올바른 이메일 형식이 아닙니다." />);
    const input = screen.getByLabelText(/이메일/);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('올바른 이메일 형식이 아닙니다.');
  });
});
