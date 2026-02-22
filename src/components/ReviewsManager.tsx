import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CustomerReview } from '../lib/types';

interface ReviewsManagerProps {
  onMessage: (type: 'success' | 'error', text: string) => void;
}

export function ReviewsManager({ onMessage }: ReviewsManagerProps) {
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [editingReview, setEditingReview] = useState<CustomerReview | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  async function fetchReviews() {
    const { data } = await supabase
      .from('customer_reviews')
      .select('*')
      .order('display_order', { ascending: true });

    if (data) {
      setReviews(data);
    }
  }

  async function handleSaveReview(formData: FormData) {
    const reviewData = {
      customer_name: formData.get('customer_name') as string,
      review_text: formData.get('review_text') as string,
      rating: formData.get('rating') ? parseInt(formData.get('rating') as string) : null,
      is_featured: formData.get('is_featured') === 'true',
      display_order: formData.get('display_order') ? parseInt(formData.get('display_order') as string) : 0,
    };

    let result;
    if (editingReview) {
      result = await supabase
        .from('customer_reviews')
        .update(reviewData)
        .eq('id', editingReview.id);
    } else {
      result = await supabase.from('customer_reviews').insert([reviewData]);
    }

    if (result.error) {
      onMessage('error', 'Error saving review: ' + result.error.message);
    } else {
      onMessage('success', editingReview ? 'Review updated successfully!' : 'Review added successfully!');
      setShowReviewForm(false);
      setEditingReview(null);
      fetchReviews();
    }
  }

  async function handleDeleteReview(id: string) {
    if (!confirm('Are you sure you want to delete this review?')) {
      return;
    }

    const { error } = await supabase.from('customer_reviews').delete().eq('id', id);

    if (error) {
      onMessage('error', 'Error deleting review: ' + error.message);
    } else {
      onMessage('success', 'Review deleted successfully!');
      fetchReviews();
    }
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="font-serif text-3xl font-light mb-2">Customer Reviews</h2>
            <p className="text-[#2F6F6B]/70">Manage customer testimonials</p>
          </div>
          <button
            onClick={() => {
              setEditingReview(null);
              setShowReviewForm(true);
            }}
            className="btn-primary inline-flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Add Review</span>
          </button>
        </div>
      </div>

      {showReviewForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 md:p-8 max-w-2xl w-full my-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-serif text-2xl md:text-3xl font-light">
                {editingReview ? 'Edit Review' : 'Add New Review'}
              </h3>
              <button
                onClick={() => {
                  setShowReviewForm(false);
                  setEditingReview(null);
                }}
                className="text-[#2F6F6B] hover:text-[#2DB6E8]"
              >
                <X size={24} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveReview(new FormData(e.currentTarget));
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">Customer Name *</label>
                <input
                  type="text"
                  name="customer_name"
                  defaultValue={editingReview?.customer_name}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Review Text *</label>
                <textarea
                  name="review_text"
                  defaultValue={editingReview?.review_text}
                  required
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded"
                  placeholder="Share your experience..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Rating (1-5 stars)</label>
                <select
                  name="rating"
                  defaultValue={editingReview?.rating || ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded"
                >
                  <option value="">No rating</option>
                  <option value="1">1 Star</option>
                  <option value="2">2 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="5">5 Stars</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Display Order</label>
                  <input
                    type="number"
                    name="display_order"
                    defaultValue={editingReview?.display_order || 0}
                    className="w-full px-4 py-2 border border-gray-300 rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Show on Homepage</label>
                  <select
                    name="is_featured"
                    defaultValue={editingReview?.is_featured ? 'true' : 'false'}
                    className="w-full px-4 py-2 border border-gray-300 rounded"
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <button type="submit" className="btn-primary flex-1">
                  <Save size={20} className="inline mr-2" />
                  Save Review
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReviewForm(false);
                    setEditingReview(null);
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-[#2F6F6B]/60 italic">No reviews yet. Add your first review!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium text-lg">{review.customer_name}</h4>
                    {review.is_featured && (
                      <span className="inline-block px-2 py-1 bg-[#D4A24C]/10 text-[#D4A24C] text-xs font-medium tracking-wider uppercase">
                        Featured
                      </span>
                    )}
                  </div>
                  {review.rating && (
                    <div className="flex items-center space-x-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={
                            i < review.rating!
                              ? 'fill-[#D4A24C] text-[#D4A24C]'
                              : 'text-gray-300'
                          }
                        />
                      ))}
                    </div>
                  )}
                  <p className="text-[#2F6F6B]/80 leading-relaxed">{review.review_text}</p>
                  <p className="text-xs text-[#2F6F6B]/50 mt-2">
                    Display Order: {review.display_order}
                  </p>
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => {
                      setEditingReview(review);
                      setShowReviewForm(true);
                    }}
                    className="p-2 text-[#2DB6E8] hover:bg-[#2DB6E8]/10 rounded"
                  >
                    <Edit2 size={20} />
                  </button>
                  <button
                    onClick={() => handleDeleteReview(review.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
