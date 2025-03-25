import React from "react";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: "portfolio"
    };
  }

  changeTab = (tab) => {
    this.setState({ activeTab: tab });
  }

  render() {
    const { activeTab } = this.state;

    return (
      <div className="app-container" style={{ 
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        {/* Header */}
        <header style={{ 
          backgroundColor: 'white',
          padding: '16px',
          textAlign: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>Investment Tracker</h1>
        </header>

        {/* Main Content */}
        <main style={{ 
          flex: 1,
          padding: '16px',
          paddingBottom: '70px' // Make room for the nav bar
        }}>
          {activeTab === "portfolio" && (
            <div style={{ 
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Portfolio</h2>
              <p style={{ color: '#666' }}>Your investment portfolio will appear here.</p>
            </div>
          )}

          {activeTab === "goals" && (
            <div style={{ 
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Goals</h2>
              <p style={{ color: '#666' }}>Your investment goals will appear here.</p>
            </div>
          )}

          {activeTab === "track" && (
            <div style={{ 
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Track</h2>
              <p style={{ color: '#666' }}>Your portfolio tracking tools will appear here.</p>
            </div>
          )}
        </main>

        {/* Old-school Bottom Navigation with inline styles for maximum reliability */}
        <nav style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'white',
          borderTop: '1px solid #ddd',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
          zIndex: 1000
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            <button
              onClick={() => this.changeTab("portfolio")}
              style={{
                flex: 1,
                padding: '12px 0',
                backgroundColor: 'transparent',
                border: 'none',
                color: activeTab === "portfolio" ? '#3b82f6' : '#6b7280',
                fontWeight: activeTab === "portfolio" ? 'bold' : 'normal',
                cursor: 'pointer'
              }}
            >
              Portfolio
            </button>
            <button
              onClick={() => this.changeTab("goals")}
              style={{
                flex: 1,
                padding: '12px 0',
                backgroundColor: 'transparent',
                border: 'none',
                color: activeTab === "goals" ? '#3b82f6' : '#6b7280',
                fontWeight: activeTab === "goals" ? 'bold' : 'normal',
                cursor: 'pointer'
              }}
            >
              Goals
            </button>
            <button
              onClick={() => this.changeTab("track")}
              style={{
                flex: 1,
                padding: '12px 0',
                backgroundColor: 'transparent',
                border: 'none',
                color: activeTab === "track" ? '#3b82f6' : '#6b7280',
                fontWeight: activeTab === "track" ? 'bold' : 'normal',
                cursor: 'pointer'
              }}
            >
              Track
            </button>
          </div>
        </nav>
      </div>
    );
  }
}

export default App;