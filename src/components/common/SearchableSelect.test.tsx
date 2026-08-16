import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchableSelect from './SearchableSelect';

const options = [
  { value: 1, label: 'Baku Arena' },
  { value: 2, label: 'Ganja Sports Hall' },
  { value: 3, label: 'Sumqayit Field' },
];

describe('SearchableSelect', () => {
  it('shows the selected option\'s label when a value is set', () => {
    render(<SearchableSelect options={options} value={2} onChange={vi.fn()} placeholder="Axtar…" />);

    expect(screen.getByRole('combobox')).toHaveValue('Ganja Sports Hall');
  });

  it('shows the placeholder when nothing is selected', () => {
    render(<SearchableSelect options={options} value="" onChange={vi.fn()} placeholder="Məkan axtar…" />);

    expect(screen.getByRole('combobox')).toHaveAttribute('placeholder', 'Məkan axtar…');
    expect(screen.getByRole('combobox')).toHaveValue('');
  });

  it('filters the dropdown as you type and selects on click', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SearchableSelect options={options} value="" onChange={onChange} placeholder="Axtar…" />);

    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('option', { name: 'Baku Arena' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Ganja Sports Hall' })).toBeInTheDocument();

    await user.type(screen.getByRole('combobox'), 'ganja');

    expect(screen.queryByRole('option', { name: 'Baku Arena' })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Ganja Sports Hall' })).toBeInTheDocument();

    await user.click(screen.getByRole('option', { name: 'Ganja Sports Hall' }));

    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('offers a pinned "clear" row at the top when emptyOptionLabel is set', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SearchableSelect
        options={options}
        value={1}
        onChange={onChange}
        placeholder="Axtar…"
        emptyOptionLabel="Bütün məkanlar"
      />
    );

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Bütün məkanlar' }));

    expect(onChange).toHaveBeenCalledWith('');
  });

  it('the clear button resets the selection without opening the dropdown list', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SearchableSelect options={options} value={1} onChange={onChange} placeholder="Axtar…" />);

    await user.click(screen.getByRole('button', { name: /seçimi ləğv et/i }));

    expect(onChange).toHaveBeenCalledWith('');
  });

  it('shows a "no results" message when nothing matches', async () => {
    const user = userEvent.setup();
    render(<SearchableSelect options={options} value="" onChange={vi.fn()} placeholder="Axtar…" />);

    await user.click(screen.getByRole('combobox'));
    await user.type(screen.getByRole('combobox'), 'zzz-no-match');

    expect(screen.getByText('Nəticə tapılmadı')).toBeInTheDocument();
  });
});
