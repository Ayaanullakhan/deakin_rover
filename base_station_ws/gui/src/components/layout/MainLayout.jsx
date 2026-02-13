'use client';

import React from 'react';
import { Box, Grid, Container } from '@mui/material';
import Header from './Header';

/**
 * Main layout component with three-column design:
 * - Left (25%): Status Panel
 * - Center (50%): Camera Feeds
 * - Right (25%): Control Panel
 */
const MainLayout = ({ statusPanel, cameraPanel, controlPanel }) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Header />

      {/* Main Content Area */}
      <Container
        maxWidth={false}
        sx={{
          flexGrow: 1,
          py: 3,
          px: 2,
        }}
      >
        <Grid container spacing={2} sx={{ height: '100%' }}>
          {/* Left Column - Status Panel (25%) */}
          <Grid item xs={12} lg={3}>
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              {statusPanel || (
                <Box
                  sx={{
                    p: 3,
                    backgroundColor: 'background.paper',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'primary.main',
                    opacity: 0.3,
                  }}
                >
                  Status Panel
                </Box>
              )}
            </Box>
          </Grid>

          {/* Center Column - Camera Feeds (50%) */}
          <Grid item xs={12} lg={6}>
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {cameraPanel || (
                <Box
                  sx={{
                    p: 3,
                    backgroundColor: 'background.paper',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'primary.main',
                    opacity: 0.3,
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  Camera Feeds (Coming in Phase 4)
                </Box>
              )}
            </Box>
          </Grid>

          {/* Right Column - Control Panel (25%) */}
          <Grid item xs={12} lg={3}>
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              {controlPanel || (
                <Box
                  sx={{
                    p: 3,
                    backgroundColor: 'background.paper',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'primary.main',
                    opacity: 0.3,
                  }}
                >
                  Control Panel
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default MainLayout;
