import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardSummary } from './DashboardSummary';

describe('DashboardSummary', () => {
  it('should render all three statistics', () => {
    render(<DashboardSummary totalLightsOn={5} roomCount={3} sceneCount={10} />);

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('lights on')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('rooms')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('scenes')).toBeInTheDocument();
  });

  it('should render zero values correctly', () => {
    render(<DashboardSummary totalLightsOn={0} roomCount={0} sceneCount={0} />);

    const zeros = screen.getAllByText('0');
    expect(zeros).toHaveLength(3);
  });

  it('should handle large numbers', () => {
    render(<DashboardSummary totalLightsOn={999} roomCount={50} sceneCount={200} />);

    expect(screen.getByText('999')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
  });

  it('should render with correct CSS classes', () => {
    const { container } = render(
      <DashboardSummary totalLightsOn={5} roomCount={3} sceneCount={10} />
    );

    expect(container.querySelector('.lights-summary')).toBeInTheDocument();
    expect(container.querySelectorAll('.summary-stat')).toHaveLength(3);
    expect(container.querySelectorAll('.stat-value')).toHaveLength(3);
    expect(container.querySelectorAll('.stat-label')).toHaveLength(3);
  });

  it('should render stats in correct order', () => {
    render(<DashboardSummary totalLightsOn={1} roomCount={2} sceneCount={3} />);

    const stats = screen.getAllByText(/^\d+$/);
    expect(stats[0]).toHaveTextContent('1'); // lights on first
    expect(stats[1]).toHaveTextContent('2'); // rooms second
    expect(stats[2]).toHaveTextContent('3'); // scenes third
  });
});
