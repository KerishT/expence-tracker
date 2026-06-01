import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button, buttonVariants } from './button';

describe('Button', () => {
  describe('рендер', () => {
    it('должен отображаться как кнопка с текстом', () => {
      render(<Button>Нажми меня</Button>);
      expect(screen.getByRole('button', { name: 'Нажми меня' })).toBeInTheDocument();
    });

    it('должен иметь data-slot="button"', () => {
      render(<Button>Текст</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('data-slot', 'button');
    });

    it('должен передавать дополнительные props', () => {
      render(<Button aria-label="действие" type="submit">ОК</Button>);
      const btn = screen.getByRole('button');
      expect(btn).toHaveAttribute('aria-label', 'действие');
      expect(btn).toHaveAttribute('type', 'submit');
    });
  });

  describe('disabled', () => {
    it('должен быть недоступен при disabled', () => {
      render(<Button disabled>Заблокировано</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('не должен вызывать onClick при disabled', async () => {
      const onClick = vi.fn();
      render(<Button disabled onClick={onClick}>Заблокировано</Button>);
      await userEvent.click(screen.getByRole('button'));
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('onClick', () => {
    it('должен вызывать onClick при клике', async () => {
      const onClick = vi.fn();
      render(<Button onClick={onClick}>Кликни</Button>);
      await userEvent.click(screen.getByRole('button'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });
});

describe('buttonVariants', () => {
  it('должен применять классы варианта default по умолчанию', () => {
    const cls = buttonVariants();
    expect(cls).toContain('bg-primary');
    expect(cls).toContain('text-primary-foreground');
  });

  it.each([
    ['outline', 'border-border'],
    ['secondary', 'bg-secondary'],
    ['ghost', 'hover:bg-muted'],
    ['destructive', 'bg-destructive/10'],
    ['link', 'underline-offset-4'],
  ] as const)('должен применять классы варианта %s', (variant, expectedClass) => {
    expect(buttonVariants({ variant })).toContain(expectedClass);
  });

  it.each([
    ['xs', 'h-6'],
    ['sm', 'h-7'],
    ['lg', 'h-9'],
    ['icon', 'size-8'],
  ] as const)('должен применять классы размера %s', (size, expectedClass) => {
    expect(buttonVariants({ size })).toContain(expectedClass);
  });

  it('должен объединять пользовательский className', () => {
    const cls = buttonVariants({ className: 'my-custom-class' });
    expect(cls).toContain('my-custom-class');
  });
});
