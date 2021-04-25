package com.example.fpl_assistant_app.Main;

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.fpl_assistant_app.PredictedLineup.PredictedLineupActivity;
import com.example.fpl_assistant_app.R;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.firestore.DocumentReference;
import com.google.firebase.firestore.DocumentSnapshot;
import com.google.firebase.firestore.FirebaseFirestore;

import java.util.ArrayList;

/**
 * A fragment representing a list of Items.
 */
public class FixturesFragment extends Fragment implements MyFixturesRecyclerViewAdapter.OnFixtureListener {

    final String TAG = "TasksSample";
    ArrayList<Fixture> fixtures = new ArrayList<>();


    // TODO: Customize parameter argument names
    private static final String ARG_COLUMN_COUNT = "column-count";
    // TODO: Customize parameters
    private int mColumnCount = 1;

    /**
     * Mandatory empty constructor for the fragment manager to instantiate the
     * fragment (e.g. upon screen orientation changes).
     */
    public FixturesFragment() {
    }

    @SuppressWarnings("unused")
    public static FixturesFragment newInstance(int columnCount) {
        FixturesFragment fragment = new FixturesFragment();
        Bundle args = new Bundle();
        args.putInt(ARG_COLUMN_COUNT, columnCount);
        fragment.setArguments(args);
        return fragment;
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (getArguments() != null) {
            mColumnCount = getArguments().getInt(ARG_COLUMN_COUNT);
        }
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_fixtures, container, false);

        // Set the adapter
        Context context = view.getContext();
        LinearLayoutManager llm = new LinearLayoutManager(context);
        llm.setOrientation(LinearLayoutManager.VERTICAL);
        RecyclerView recyclerView = (RecyclerView) view.findViewById(R.id.list);
        recyclerView.setLayoutManager(llm);
        if (mColumnCount <= 1) {
            recyclerView.setLayoutManager(new LinearLayoutManager(context));
        } else {
            recyclerView.setLayoutManager(new GridLayoutManager(context, mColumnCount));
        }
        final MyFixturesRecyclerViewAdapter adapter = new MyFixturesRecyclerViewAdapter(fixtures, this);
        recyclerView.setAdapter(adapter);

        //set up firebase instance
        FirebaseFirestore db = FirebaseFirestore.getInstance();

        //get fixtures from database
        DocumentReference docRef = db.collection("fixtures").document("currentWeek");
        docRef.get().addOnCompleteListener(new OnCompleteListener<DocumentSnapshot>() {
            @Override
            public void onComplete(@NonNull Task<DocumentSnapshot> task) {
                if (task.isSuccessful()) {
                    DocumentSnapshot document = task.getResult();
                    if (document.exists()) {
                        for (int i = 1; i < 11; i++) {
                            Fixture fixture1 = new Fixture();
                            fixture1.setFixtureName(document.getString(Integer.toString(i)));
                            fixtures.add(fixture1);
                            adapter.notifyDataSetChanged();
                        }
                    } else {
                        Log.d(TAG, "No such document");
                    }
                } else {
                    Log.d(TAG, "get failed with ", task.getException());
                }
            }
            });

        return view;
    }

    //when fixture is clicked, record what was clicked and pass to new activity
    @Override
    public void onFixtureClick(int position) {
        Log.d(TAG, "onFixtureClick: clicked " +fixtures.get(position));
        Intent intent = new Intent(getContext(), PredictedLineupActivity.class);
        intent.putExtra("teams", fixtures.get(position).toString());
        startActivity(intent);
    }
}