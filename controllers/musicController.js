require("dotenv").config();
const prisma = require("../lib/prisma");
const path = require("path");
const fs = require("fs");

// Always generate rap music with lyrics about the folder
const analyzeStudyMaterial = (files, folderName) => {
  return {
    studyType: 'rap',
    musicType: 'rap',
    description: `A rap song introducing and themed around the folder "${folderName}". Include clever rhymes, educational content, and reference the folder's purpose or subject.`,
    tags: 'rap, hip-hop, lyrics, vocal, clever, educational, folder-intro'
  };
};

// Generate music using Suno API
const generateMusic = async (req, res) => {
  try {
    console.log('Music generation request for folder ID:', req.params.id);
    const folderId = Number(req.params.id);
    
    // Get folder and its files
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      include: { files: true }
    });
    
    if (!folder) {
      return res.status(404).send("Folder not found");
    }

  // Always generate rap music with lyrics about the folder
  const analysis = analyzeStudyMaterial(folder.files, folder.name);
    console.log('Study analysis:', analysis);

    // Generate rap song with lyrics introducing the folder using Suno API
    const sunoResponse = await fetch('https://studio-api.prod.suno.com/api/v2/external/hackmit/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUNO_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        topic: `Create a rap song with lyrics that introduces the folder "${folder.name}". The rap should reference the folder's subject and motivate the listener to study. Include clever rhymes and educational content.`,
        tags: analysis.tags,
        make_instrumental: false
      })
    });

    if (!sunoResponse.ok) {
      const errorText = await sunoResponse.text();
      console.error('Suno API error:', errorText);
      return res.status(500).send("Error generating music: " + errorText);
    }

    const sunoData = await sunoResponse.json();
    console.log('Suno generation started:', sunoData.id);

    // Create initial queue with this track
    const initialQueue = [{
      id: sunoData.id,
      status: 'generating',
      title: '',
      audioUrl: '',
      imageUrl: '',
      type: analysis.musicType,
      description: analysis.description,
      createdAt: new Date()
    }];

    // Store the generation request in database with queue
    await prisma.folder.update({
      where: { id: folderId },
      data: {
        musicClipId: sunoData.id,
        musicStatus: 'generating',
        musicType: analysis.musicType,
        musicDescription: analysis.description,
        musicQueue: initialQueue,
        currentTrackIndex: 0,
        isQueueActive: true
      }
    });

    // Start generating next track in background (with delay to avoid rate limits)
    setTimeout(() => {
      generateNextTrack(folderId, analysis, folder.name);
    }, 5000); // 5 second delay

    res.json({
      success: true,
      clipId: sunoData.id,
      message: 'Music generation started! Check back in a minute.',
      analysis: analysis,
      queueActive: true
    });

  } catch (error) {
    console.error('Music generation error:', error);
    res.status(500).send("Error generating music: " + error.message);
  }
};

// Check music generation status and get audio URL
const getMusicStatus = async (req, res) => {
  try {
    const folderId = Number(req.params.id);
    const folder = await prisma.folder.findUnique({
      where: { id: folderId }
    });

    if (!folder || !folder.musicQueue) {
      return res.status(404).send("No music queue found for this folder");
    }

    const queue = Array.isArray(folder.musicQueue) ? folder.musicQueue : [];
    const currentIndex = folder.currentTrackIndex || 0;
    const currentTrack = queue[currentIndex];

    if (!currentTrack) {
      return res.status(404).send("No current track found");
    }

    // Check status with Suno API for current track
    const sunoResponse = await fetch(`https://studio-api.prod.suno.com/api/v2/external/hackmit/clips?ids=${currentTrack.id}`, {
      headers: {
        'Authorization': `Bearer ${process.env.SUNO_API_KEY}`
      }
    });

    if (!sunoResponse.ok) {
      return res.status(500).send("Error checking music status");
    }

    const clips = await sunoResponse.json();
    const clip = clips[0];

    if (!clip) {
      return res.status(404).send("Music clip not found");
    }

    // Update current track in queue
    const updatedQueue = [...queue];
    updatedQueue[currentIndex] = {
      ...currentTrack,
      status: clip.status,
      title: clip.title || currentTrack.title,
      audioUrl: clip.audio_url || currentTrack.audioUrl,
      imageUrl: clip.image_url || currentTrack.imageUrl
    };

    // Update folder with current status and queue
    await prisma.folder.update({
      where: { id: folderId },
      data: {
        musicStatus: clip.status,
        musicTitle: clip.title || '',
        musicAudioUrl: clip.audio_url || '',
        musicImageUrl: clip.image_url || '',
        musicQueue: updatedQueue
      }
    });

    res.json({
      status: clip.status,
      title: clip.title,
      audioUrl: clip.audio_url,
      imageUrl: clip.image_url,
      metadata: clip.metadata,
      currentIndex: currentIndex,
      totalTracks: queue.length,
      queue: updatedQueue
    });

  } catch (error) {
    console.error('Music status check error:', error);
    res.status(500).send("Error checking music status: " + error.message);
  }
};

// Get current music for a folder
const getFolderMusic = async (req, res) => {
  try {
    const folderId = Number(req.params.id);
    const folder = await prisma.folder.findUnique({
      where: { id: folderId }
    });

    if (!folder) {
      return res.status(404).send("Folder not found");
    }

    res.json({
      hasMusic: !!folder.musicClipId,
      status: folder.musicStatus,
      title: folder.musicTitle,
      audioUrl: folder.musicAudioUrl,
      imageUrl: folder.musicImageUrl,
      musicType: folder.musicType,
      description: folder.musicDescription
    });

  } catch (error) {
    console.error('Get folder music error:', error);
    res.status(500).send("Error getting folder music: " + error.message);
  }
};

// Generate next rap track with lyrics using Suno API
const generateNextTrack = async (folderId, analysis, folderName) => {
  try {
    console.log('Generating next track for folder:', folderId);
    
    const sunoResponse = await fetch('https://studio-api.prod.suno.com/api/v2/external/hackmit/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUNO_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        topic: `Create a new rap song with lyrics as a variation, still themed around the folder "${folderName}". Include clever rhymes and educational content.`,
        tags: analysis.tags,
        make_instrumental: false
      })
    });

    if (!sunoResponse.ok) {
      console.error('Failed to generate next track');
      return;
    }

    const sunoData = await sunoResponse.json();
    console.log('Next track generation started:', sunoData.id);

    // Add to queue
    const folder = await prisma.folder.findUnique({
      where: { id: folderId }
    });

    if (folder && folder.musicQueue) {
      const queue = Array.isArray(folder.musicQueue) ? folder.musicQueue : [];
      queue.push({
        id: sunoData.id,
        status: 'generating',
        title: '',
        audioUrl: '',
        imageUrl: '',
        type: analysis.musicType,
        description: analysis.description,
        createdAt: new Date()
      });

      await prisma.folder.update({
        where: { id: folderId },
        data: { musicQueue: queue }
      });
    }
  } catch (error) {
    console.error('Error generating next track:', error);
  }
};

// Skip to next track
const skipNext = async (req, res) => {
  try {
    const folderId = Number(req.params.id);
    const folder = await prisma.folder.findUnique({
      where: { id: folderId }
    });

    if (!folder || !folder.musicQueue) {
      return res.status(404).send("No music queue found");
    }

    const queue = Array.isArray(folder.musicQueue) ? folder.musicQueue : [];
    const currentIndex = folder.currentTrackIndex || 0;
    const nextIndex = currentIndex + 1;

    if (nextIndex >= queue.length) {
      return res.status(400).send("No next track available");
    }

    // Update current track index
    await prisma.folder.update({
      where: { id: folderId },
      data: { currentTrackIndex: nextIndex }
    });

    const nextTrack = queue[nextIndex];
    res.json({
      success: true,
      track: nextTrack,
      currentIndex: nextIndex,
      totalTracks: queue.length
    });

  } catch (error) {
    console.error('Skip next error:', error);
    res.status(500).send("Error skipping to next track: " + error.message);
  }
};

// Skip to previous track
const skipPrevious = async (req, res) => {
  try {
    const folderId = Number(req.params.id);
    const folder = await prisma.folder.findUnique({
      where: { id: folderId }
    });

    if (!folder || !folder.musicQueue) {
      return res.status(404).send("No music queue found");
    }

    const queue = Array.isArray(folder.musicQueue) ? folder.musicQueue : [];
    const currentIndex = folder.currentTrackIndex || 0;
    const prevIndex = currentIndex - 1;

    if (prevIndex < 0) {
      return res.status(400).send("No previous track available");
    }

    // Update current track index
    await prisma.folder.update({
      where: { id: folderId },
      data: { currentTrackIndex: prevIndex }
    });

    const prevTrack = queue[prevIndex];
    res.json({
      success: true,
      track: prevTrack,
      currentIndex: prevIndex,
      totalTracks: queue.length
    });

  } catch (error) {
    console.error('Skip previous error:', error);
    res.status(500).send("Error skipping to previous track: " + error.message);
  }
};

// Get current track from queue
const getCurrentTrack = async (req, res) => {
  try {
    const folderId = Number(req.params.id);
    const folder = await prisma.folder.findUnique({
      where: { id: folderId }
    });

    if (!folder || !folder.musicQueue) {
      return res.status(404).send("No music queue found");
    }

    const queue = Array.isArray(folder.musicQueue) ? folder.musicQueue : [];
    const currentIndex = folder.currentTrackIndex || 0;
    const currentTrack = queue[currentIndex];

    if (!currentTrack) {
      return res.status(404).send("No current track found");
    }

    // Check if we need to update track status
    if (currentTrack.status === 'generating' || currentTrack.status === 'streaming') {
      try {
        const sunoResponse = await fetch(`https://studio-api.prod.suno.com/api/v2/external/hackmit/clips?ids=${currentTrack.id}`, {
          headers: {
            'Authorization': `Bearer ${process.env.SUNO_API_KEY}`
          }
        });

        if (sunoResponse.ok) {
          const clips = await sunoResponse.json();
          const clip = clips[0];
          
          if (clip) {
            // Update track in queue
            const updatedQueue = [...queue];
            updatedQueue[currentIndex] = {
              ...currentTrack,
              status: clip.status,
              title: clip.title || currentTrack.title,
              audioUrl: clip.audio_url || currentTrack.audioUrl,
              imageUrl: clip.image_url || currentTrack.imageUrl
            };

            // Update database
            await prisma.folder.update({
              where: { id: folderId },
              data: { musicQueue: updatedQueue }
            });

            currentTrack.status = clip.status;
            currentTrack.title = clip.title || currentTrack.title;
            currentTrack.audioUrl = clip.audio_url || currentTrack.audioUrl;
            currentTrack.imageUrl = clip.image_url || currentTrack.imageUrl;
          }
        }
      } catch (error) {
        console.error('Error updating track status:', error);
      }
    }

    res.json({
      success: true,
      track: currentTrack,
      currentIndex: currentIndex,
      totalTracks: queue.length,
      hasNext: currentIndex < queue.length - 1,
      hasPrevious: currentIndex > 0,
      queue: queue
    });

  } catch (error) {
    console.error('Get current track error:', error);
    res.status(500).send("Error getting current track: " + error.message);
  }
};

// Regenerate music (clear queue and start fresh)
const regenerateMusic = async (req, res) => {
  try {
    console.log('Music regeneration request for folder ID:', req.params.id);
    const folderId = Number(req.params.id);
    
    // Get folder and its files
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      include: { files: true }
    });
    
    if (!folder) {
      return res.status(404).send("Folder not found");
    }

  // Always generate rap music with lyrics about the folder
  const analysis = analyzeStudyMaterial(folder.files, folder.name);
    console.log('Study analysis for regeneration:', analysis);

    // Generate new rap song with lyrics introducing the folder using Suno API
    const sunoResponse = await fetch('https://studio-api.prod.suno.com/api/v2/external/hackmit/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUNO_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        topic: `Create a rap song with lyrics that introduces the folder "${folder.name}" for a fresh generation. The rap should reference the folder's subject and motivate the listener to study. Include clever rhymes and educational content.`,
        tags: analysis.tags,
        make_instrumental: false
      })
    });

    if (!sunoResponse.ok) {
      const errorText = await sunoResponse.text();
      console.error('Suno API error:', errorText);
      return res.status(500).send("Error generating music: " + errorText);
    }

    const sunoData = await sunoResponse.json();
    console.log('Suno regeneration started:', sunoData.id);

    // Create fresh queue with new track
    const freshQueue = [{
      id: sunoData.id,
      status: 'generating',
      title: '',
      audioUrl: '',
      imageUrl: '',
      type: analysis.musicType,
      description: analysis.description,
      createdAt: new Date()
    }];

    // Clear existing queue and start fresh
    await prisma.folder.update({
      where: { id: folderId },
      data: {
        musicClipId: sunoData.id,
        musicStatus: 'generating',
        musicType: analysis.musicType,
        musicDescription: analysis.description,
        musicQueue: freshQueue,
        currentTrackIndex: 0,
        isQueueActive: true
      }
    });

    // Start generating next track in background (with delay to avoid rate limits)
    setTimeout(() => {
      generateNextTrack(folderId, analysis);
    }, 5000); // 5 second delay

    res.json({
      success: true,
      clipId: sunoData.id,
      message: 'Music regeneration started! Fresh music coming up.',
      analysis: analysis,
      queueActive: true
    });

  } catch (error) {
    console.error('Music regeneration error:', error);
    res.status(500).send("Error regenerating music: " + error.message);
  }
};

module.exports = {
  generateMusic,
  getMusicStatus,
  getFolderMusic,
  skipNext,
  skipPrevious,
  getCurrentTrack,
  regenerateMusic
};
