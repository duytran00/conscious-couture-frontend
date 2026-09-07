import React, { useState, useEffect } from 'react';
import './ReviewSection.css';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const StarRating = ({ rating, onRate, interactive = false, size = 'md' }) => {
  const [hovered, setHovered] = useState(0);
  const sizeClass = size === 'sm' ? 'star-sm' : size === 'lg' ? 'star-lg' : 'star-md';

  return (
    <div className={`star-rating ${sizeClass}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${
            star <= (interactive ? hovered || rating : rating)
              ? 'star-filled'
              : 'star-empty'
          } ${interactive ? 'star-interactive' : ''}`}
          onClick={() => interactive && onRate && onRate(star)}
          onMouseEnter={() => interactive && setHovered(star)}
          onMouseLeave={() => interactive && setHovered(0)}
        >
          ★
        </span>
      ))}
    </div>
  );
};

const RatingBreakdown = ({ breakdown, total }) => {
  return (
    <div className="rating-breakdown">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = breakdown[String(star)] || 0;
        const percent = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={star} className="breakdown-row">
            <span className="breakdown-label">{star} ★</span>
            <div className="breakdown-bar-bg">
              <div
                className="breakdown-bar-fill"
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="breakdown-count">{count}</span>
          </div>
        );
      })}
    </div>
  );
};

const ReviewCard = ({ review, currentUserId, onDelete, onEdit }) => {
  const isOwner = currentUserId && review.reviewer_id === currentUserId;
  const date = review.created_at
    ? new Date(review.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';

  const initial = (review.reviewer_name || 'A').charAt(0).toUpperCase();

  return (
    <div className="review-card">
      <div className="review-card-header">
        <div className="reviewer-info">
          <div className="reviewer-avatar">{initial}</div>
          <div>
            <p className="reviewer-name">{review.reviewer_name || 'Anonymous'}</p>
            <p className="review-date">{date}</p>
          </div>
        </div>
        <StarRating rating={review.rating} size="sm" />
      </div>
      {review.title && <h4 className="review-title">{review.title}</h4>}
      {review.comment && <p className="review-comment">{review.comment}</p>}
      {isOwner && (
        <div className="review-actions">
          <button className="review-action-btn edit-btn" onClick={() => onEdit(review)}>
            Edit
          </button>
          <button className="review-action-btn delete-btn" onClick={() => onDelete(review.review_id)}>
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

const ReviewForm = ({ clothingId, currentUserId, existingReview, onSubmitted, onCancel }) => {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [title, setTitle] = useState(existingReview?.title || '');
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!existingReview;

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a star rating');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');

      const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      };

      let response;

      if (isEditing) {
        response = await fetch(`${API_BASE_URL}/reviews/${existingReview.review_id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            rating,
            title: title.trim() || null,
            comment: comment.trim() || null,
          }),
        });
      } else {
        response = await fetch(`${API_BASE_URL}/reviews/`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            clothing_id: clothingId,
            reviewer_id: currentUserId,
            rating,
            title: title.trim() || null,
            comment: comment.trim() || null,
          }),
        });
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Failed to ${isEditing ? 'update' : 'submit'} review`);
      }

      setRating(0);
      setTitle('');
      setComment('');
      onSubmitted();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="review-form">
      <h3 className="review-form-title">
        {isEditing ? 'Edit Your Review' : 'Write a Review'}
      </h3>

      <div className="form-group">
        <label className="form-label">Your Rating *</label>
        <StarRating rating={rating} onRate={setRating} interactive size="lg" />
      </div>

      <div className="form-group">
        <label className="form-label">Title (optional)</label>
        <input
          type="text"
          className="form-input"
          placeholder="Summarize your experience"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Review (optional)</label>
        <textarea
          className="form-textarea"
          placeholder="Tell others what you think about this item..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
        />
      </div>

      {error && <div className="review-error">{error}</div>}

      <div className="form-buttons">
        <button
          className="submit-review-btn"
          onClick={handleSubmit}
          disabled={submitting || rating === 0}
        >
          {submitting ? 'Submitting...' : isEditing ? 'Update Review' : 'Submit Review'}
        </button>
        {isEditing && onCancel && (
          <button className="cancel-review-btn" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

const ReviewSection = ({ clothingId, ownerId }) => {
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [ratingBreakdown, setRatingBreakdown] = useState({});
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [editingReview, setEditingReview] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    // Match exactly what Header.jsx uses (Google login stores these keys)
    const id = localStorage.getItem('userId') 
            || localStorage.getItem('user_id') 
            || localStorage.getItem('userInput'); // fallback for some Google flows
  
    if (id) {
      setCurrentUserId(parseInt(id, 10));
    }
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/reviews/clothing/${clothingId}?sort=${sortBy}`
      );
      if (!response.ok) throw new Error('Failed to load reviews');
      const data = await response.json();
      setReviews(data.reviews);
      setAverageRating(data.average_rating);
      setTotalReviews(data.total);
      setRatingBreakdown(data.rating_breakdown);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clothingId) {
      fetchReviews();
    }
  }, [clothingId, sortBy]);

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete review');
      fetchReviews();
    } catch (err) {
      console.error('Error deleting review:', err);
    }
  };

  const handleEdit = (review) => {
    setEditingReview(review);
    setShowForm(true);
  };

  const handleSubmitted = () => {
    setShowForm(false);
    setEditingReview(null);
    fetchReviews();
  };

  const userHasReview = currentUserId
    ? reviews.some((r) => r.reviewer_id === currentUserId)
    : false;

  const isOwner = currentUserId && currentUserId === ownerId;
  const canReview = currentUserId && !isOwner && !userHasReview;

  return (
    <div className="review-section">
      <h2 className="review-section-title">Reviews & Ratings</h2>

      {/* Summary Row */}
      <div className="review-summary">
        <div className="summary-left">
          <span className="big-rating">{averageRating.toFixed(1)}</span>
          <div>
            <StarRating rating={Math.round(averageRating)} size="md" />
            <p className="total-reviews-text">
              {totalReviews} review{totalReviews !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="summary-right">
          <RatingBreakdown breakdown={ratingBreakdown} total={totalReviews} />
        </div>
      </div>

      {/* Write Review Button / Form */}
      {!showForm && canReview && (
        <button className="write-review-btn" onClick={() => setShowForm(true)}>
          Write a Review
        </button>
      )}

      {!currentUserId && (
        <p className="login-prompt">
          <a href="/login">Sign in</a> to leave a review.
        </p>
      )}

      {isOwner && !showForm && (
        <p className="owner-notice">You cannot review your own item.</p>
      )}

      {showForm && currentUserId && (
        <ReviewForm
          clothingId={parseInt(clothingId, 10)}
          currentUserId={currentUserId}
          existingReview={editingReview}
          onSubmitted={handleSubmitted}
          onCancel={() => {
            setShowForm(false);
            setEditingReview(null);
          }}
        />
      )}

      {/* Sort Controls */}
      {reviews.length > 0 && (
        <div className="sort-controls">
          <label>Sort by: </label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
          </select>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <p className="reviews-loading">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="no-reviews">No reviews yet. Be the first to review this item!</p>
      ) : (
        <div className="reviews-list">
          {reviews.map((review) => (
            <ReviewCard
              key={review.review_id}
              review={review}
              currentUserId={currentUserId}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewSection;