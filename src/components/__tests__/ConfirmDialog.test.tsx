import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmDialog from '../ConfirmDialog';

describe('ConfirmDialog', () => {
  const defaultProps = {
    title: 'Confirm Action',
    message: 'Are you sure?',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  it('should render with title and message', () => {
    render(<ConfirmDialog {...defaultProps} />);

    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('should call onConfirm when confirm button is clicked', () => {
    render(<ConfirmDialog {...defaultProps} />);

    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);

    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when cancel button is clicked', () => {
    render(<ConfirmDialog {...defaultProps} />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when overlay is clicked', () => {
    render(<ConfirmDialog {...defaultProps} />);

    const overlay = screen.getByText('Confirm Action').closest('.confirm-dialog-overlay');
    if (overlay) {
      fireEvent.click(overlay);
      expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
    }
  });

  it('should render with danger type styling', () => {
    render(<ConfirmDialog {...defaultProps} type="danger" />);

    const header = screen.getByText('Confirm Action').closest('.confirm-dialog-header');
    expect(header).toHaveClass('confirm-dialog-danger');
  });

  it('should support custom button text', () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        confirmText="Delete"
        cancelText="Keep"
      />
    );

    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Keep')).toBeInTheDocument();
  });
});
