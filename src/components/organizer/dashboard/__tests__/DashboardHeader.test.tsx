import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom';
import { DashboardHeader } from '../DashboardHeader';

test('navigates to CreateTournament page when clicking Create Tournament', async () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<DashboardHeader organizerName="Test" />} />
        <Route
          path="/tournament-management/new"
          element={<div>Create Tournament Page</div>}
        />
      </Routes>
    </MemoryRouter>
  );

  const button = screen.getByRole('button', { name: /create tournament/i });
  await userEvent.click(button);

  expect(screen.getByText('Create Tournament Page')).toBeInTheDocument();
});
